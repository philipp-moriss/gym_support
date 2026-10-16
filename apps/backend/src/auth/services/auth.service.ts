import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ACCOUNTS,
  PROGRAM_SEEDER,
  type AccountRecord,
  type Accounts,
  type AuthUser,
  type ProgramSeeder,
  type ProgramTemplate,
} from '../../shared';
import { SessionsService } from './sessions.service';

/** Полезная нагрузка access-токена. */
export interface AccessTokenPayload {
  sub: string;
  /** AccountRecord.sessionsVersion на момент выдачи. */
  ver: number;
}

export const toMe = ({ id, login, codeDigits, createdAt }: AccountRecord) => ({
  id,
  login,
  codeDigits,
  createdAt,
});

const tooManyAttempts = (retryAfterSec: number) =>
  new HttpException(
    { statusCode: 429, message: 'Too many attempts', retryAfterSec },
    HttpStatus.TOO_MANY_REQUESTS,
  );

/**
 * Регистрация и вход. Ошибка неверного кода всегда одна и та же, чтобы не
 * подсказывать, существует ли логин; блокировка отвечает 429 со сроком.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(ACCOUNTS) private accounts: Accounts,
    @Inject(PROGRAM_SEEDER) private program: ProgramSeeder,
    private sessions: SessionsService,
    private jwt: JwtService,
  ) {}

  async register(template: ProgramTemplate = 'back', userAgent?: string) {
    const { account, code } = await this.accounts.create();
    await this.program.seed(account.id, template);
    return { ...(await this.issue(account, userAgent)), code };
  }

  async loginWithCode(login: string, code: string, userAgent?: string) {
    const check = await this.accounts.verifyCode(login, code);
    if (check.ok) return this.issue(check.account, userAgent);
    if (check.reason === 'locked') throw tooManyAttempts(check.retryAfterSec);
    throw new UnauthorizedException('Invalid login or code');
  }

  /** Вход одним 8-значным кодом, без логина. */
  async loginByCode(code: string, userAgent?: string) {
    const check = await this.accounts.findByCode(code);
    if (check.ok) return this.issue(check.account, userAgent);
    if (check.reason === 'locked') throw tooManyAttempts(check.retryAfterSec);
    throw new UnauthorizedException('Invalid code');
  }

  /**
   * Смена кода вошедшим пользователем. Неверный текущий код — 403, а не 401:
   * токен при этом в порядке, клиенту не нужно его обновлять и повторять запрос.
   * Старые токены (и этого устройства) больше не работают — отдаём новую пару.
   */
  async changeCode(current: AuthUser, currentCode: string, userAgent?: string) {
    const change = await this.accounts.changeCode(current.id, currentCode);
    if (change.ok) {
      return {
        ...(await this.issue(change.account, userAgent)),
        code: change.code,
      };
    }
    if (change.reason === 'locked') throw tooManyAttempts(change.retryAfterSec);
    throw new ForbiddenException('Invalid code');
  }

  /** Старый аккаунт переходит на вход одним кодом: новый код и новая пара токенов. */
  async upgradeCode(current: AuthUser, userAgent?: string) {
    const upgraded = await this.accounts.upgradeCode(current.id);
    if (!upgraded) throw new ConflictException('Code is already 8 digits');
    return {
      ...(await this.issue(upgraded.account, userAgent)),
      code: upgraded.code,
    };
  }

  async refresh(refreshToken: string, userAgent?: string) {
    const session = await this.sessions.consume(refreshToken);
    const account = await this.accounts.findById(session.userId);
    if (!account || account.sessionsVersion !== session.userSessionsVersion) {
      throw new UnauthorizedException();
    }
    return this.issue(account, userAgent);
  }

  logout(refreshToken: string) {
    return this.sessions.revoke(refreshToken);
  }

  async me(current: AuthUser) {
    const account = await this.accounts.findById(current.id);
    if (!account) throw new UnauthorizedException();
    return toMe(account);
  }

  private async issue(account: AccountRecord, userAgent?: string) {
    const payload: AccessTokenPayload = {
      sub: account.id,
      ver: account.sessionsVersion,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      refreshToken: await this.sessions.create(
        account.id,
        account.sessionsVersion,
        userAgent,
      ),
      user: toMe(account),
    };
  }
}
