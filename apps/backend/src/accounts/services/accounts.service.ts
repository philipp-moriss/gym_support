import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type {
  AccountRecord,
  Accounts,
  CodeChange,
  CodeCheck,
} from '../../shared';
import { Account } from '../entities/account.entity';
import {
  generateCode,
  generateLogin,
  hashCode,
  verifyCodeHash,
} from './access-code';

/** После стольких неверных кодов подряд аккаунт блокируется. */
export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

const toRecord = ({
  id,
  login,
  sessionsVersion,
  createdAt,
}: Account): AccountRecord => ({
  id,
  login,
  sessionsVersion,
  createdAt,
});

const isUniqueViolation = (e: unknown) =>
  e instanceof QueryFailedError &&
  (e.driverError as { code?: string })?.code === '23505';

@Injectable()
export class AccountsService implements Accounts {
  private readonly pepper: string;

  constructor(
    @InjectRepository(Account) private accounts: Repository<Account>,
    config: ConfigService,
  ) {
    this.pepper = config.getOrThrow<string>('CODE_PEPPER');
  }

  async create() {
    const code = generateCode();
    const codeHash = await hashCode(code, this.pepper);
    // Логин случайный: при редком совпадении пробуем ещё раз.
    for (let attempt = 0; ; attempt++) {
      try {
        const account = await this.accounts.save(
          this.accounts.create({ login: generateLogin(), codeHash }),
        );
        return { account: toRecord(account), code };
      } catch (e) {
        if (!isUniqueViolation(e) || attempt >= 9) throw e;
      }
    }
  }

  async verifyCode(login: string, code: string): Promise<CodeCheck> {
    const account = await this.accounts.findOneBy({
      login: normalizeLogin(login),
    });
    if (!account) return { ok: false, reason: 'invalid' };
    return this.check(account, code);
  }

  async changeCode(id: string, currentCode: string): Promise<CodeChange> {
    const account = await this.accounts.findOneBy({ id });
    if (!account) return { ok: false, reason: 'invalid' };
    const check = await this.check(account, currentCode);
    if (!check.ok) return check;

    const code = generateCode();
    const codeHash = await hashCode(code, this.pepper);
    // Версия растёт атомарно: параллельные смены не выдадут одинаковую версию.
    const rows: unknown = await this.accounts.query(
      `UPDATE accounts SET "codeHash" = $2, "sessionsVersion" = "sessionsVersion" + 1, "failedAttempts" = 0, "lockedUntil" = NULL, "updatedAt" = now() WHERE id = $1 RETURNING "sessionsVersion"`,
      [account.id, codeHash],
    );
    const sessionsVersion = (
      rows as [[{ sessionsVersion: number }], number]
    )[0][0].sessionsVersion;
    return { ok: true, account: { ...check.account, sessionsVersion }, code };
  }

  /** Проверка кода с лимитом попыток: общий счётчик для входа и смены кода. */
  private async check(account: Account, code: string): Promise<CodeCheck> {
    const now = Date.now();
    if (account.lockedUntil && account.lockedUntil.getTime() > now) {
      return {
        ok: false,
        reason: 'locked',
        retryAfterSec: secondsUntil(account.lockedUntil),
      };
    }

    if (await verifyCodeHash(code, this.pepper, account.codeHash)) {
      if (account.failedAttempts || account.lockedUntil) {
        await this.accounts.update(account.id, {
          failedAttempts: 0,
          lockedUntil: null,
        });
      }
      return { ok: true, account: toRecord(account) };
    }

    // Счётчик растёт атомарно: параллельные попытки не обходят лимит.
    const rows: unknown = await this.accounts.query(
      `UPDATE accounts SET "failedAttempts" = "failedAttempts" + 1 WHERE id = $1 RETURNING "failedAttempts"`,
      [account.id],
    );
    const failed = (rows as [[{ failedAttempts: number }], number])[0][0]
      .failedAttempts;
    if (failed >= MAX_ATTEMPTS) {
      const lockedUntil = new Date(now + LOCK_MINUTES * 60_000);
      await this.accounts.update(account.id, {
        failedAttempts: 0,
        lockedUntil,
      });
      return {
        ok: false,
        reason: 'locked',
        retryAfterSec: secondsUntil(lockedUntil),
      };
    }
    return { ok: false, reason: 'invalid' };
  }

  async findById(id: string) {
    const account = await this.accounts.findOneBy({ id });
    return account ? toRecord(account) : null;
  }
}

export const normalizeLogin = (login: string) => login.trim().toLowerCase();

const secondsUntil = (date: Date) =>
  Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));
