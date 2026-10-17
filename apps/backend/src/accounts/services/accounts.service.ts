import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import type {
  AccountPatch,
  AccountRecord,
  Accounts,
  CodeChange,
  CodeCheck,
  Role,
} from '../../shared';
import { Account } from '../entities/account.entity';
import {
  codeLookup,
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
  role,
  name,
  disabled,
  aiDailyLimit,
  sessionsVersion,
  codeLookup,
  createdAt,
}: Account): AccountRecord => ({
  id,
  login,
  role,
  name,
  disabled,
  aiDailyLimit,
  sessionsVersion,
  codeDigits: codeLookup ? 8 : 6,
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

  async create({
    role = 'client',
    name = null,
  }: { role?: Role; name?: string | null } = {}) {
    // Логин и код случайные и уникальные: при редком совпадении пробуем ещё раз.
    for (let attempt = 0; ; attempt++) {
      const { code, codeHash, codeLookup } = await this.newCode();
      try {
        const account = await this.accounts.save(
          this.accounts.create({
            login: generateLogin(),
            codeHash,
            codeLookup,
            role,
            name: name?.trim() || null,
          }),
        );
        return { account: toRecord(account), code };
      } catch (e) {
        if (!isUniqueViolation(e) || attempt >= 9) throw e;
      }
    }
  }

  async findByCode(code: string): Promise<CodeCheck> {
    const account = await this.accounts.findOneBy({
      codeLookup: codeLookup(code, this.pepper),
    });
    if (!account || account.disabled) return { ok: false, reason: 'invalid' };
    if (account.lockedUntil && account.lockedUntil.getTime() > Date.now()) {
      return {
        ok: false,
        reason: 'locked',
        retryAfterSec: secondsUntil(account.lockedUntil),
      };
    }
    return { ok: true, account: toRecord(account) };
  }

  private async newCode() {
    const code = generateCode();
    return {
      code,
      codeHash: await hashCode(code, this.pepper),
      codeLookup: codeLookup(code, this.pepper),
    };
  }

  async verifyCode(login: string, code: string): Promise<CodeCheck> {
    const account = await this.accounts.findOneBy({
      login: normalizeLogin(login),
    });
    if (!account || account.disabled) return { ok: false, reason: 'invalid' };
    return this.check(account, code);
  }

  async changeCode(id: string, currentCode: string): Promise<CodeChange> {
    const account = await this.accounts.findOneBy({ id });
    if (!account) return { ok: false, reason: 'invalid' };
    const check = await this.check(account, currentCode);
    if (!check.ok) return check;
    return { ok: true, ...(await this.replaceCode(account)) };
  }

  async resetCode(id: string) {
    return this.replaceCode(await this.getOrFail(id));
  }

  /** Новый 8-значный уникальный код; все выданные токены перестают работать. */
  private async replaceCode(account: Account) {
    // Новый код всегда 8-значный и уникальный: после смены можно входить без логина.
    for (let attempt = 0; ; attempt++) {
      const { code, codeHash, codeLookup } = await this.newCode();
      try {
        // Версия растёт атомарно: параллельные смены не выдадут одинаковую версию.
        const rows: unknown = await this.accounts.query(
          `UPDATE accounts SET "codeHash" = $2, "codeLookup" = $3, "sessionsVersion" = "sessionsVersion" + 1, "failedAttempts" = 0, "lockedUntil" = NULL, "updatedAt" = now() WHERE id = $1 RETURNING "sessionsVersion"`,
          [account.id, codeHash, codeLookup],
        );
        const sessionsVersion = (
          rows as [[{ sessionsVersion: number }], number]
        )[0][0].sessionsVersion;
        return {
          account: {
            ...toRecord(account),
            sessionsVersion,
            codeDigits: 8 as const,
          },
          code,
        };
      } catch (e) {
        if (!isUniqueViolation(e) || attempt >= 9) throw e;
      }
    }
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

  async findByIds(ids: string[]) {
    if (!ids.length) return [];
    return (await this.accounts.findBy({ id: In(ids) })).map(toRecord);
  }

  async list(role: Role) {
    const rows = await this.accounts.find({
      where: { role },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toRecord);
  }

  async update(id: string, patch: AccountPatch) {
    const account = await this.getOrFail(id);
    if (patch.name !== undefined) account.name = patch.name?.trim() || null;
    if (patch.disabled !== undefined) account.disabled = patch.disabled;
    if (patch.aiDailyLimit !== undefined)
      account.aiDailyLimit = patch.aiDailyLimit;
    return toRecord(await this.accounts.save(account));
  }

  private async getOrFail(id: string) {
    const account = await this.accounts.findOneBy({ id });
    if (!account) throw new NotFoundException();
    return account;
  }
}

export const normalizeLogin = (login: string) => login.trim().toLowerCase();

const secondsUntil = (date: Date) =>
  Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));
