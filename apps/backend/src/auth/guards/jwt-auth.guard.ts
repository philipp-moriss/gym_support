import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import {
  ACCOUNTS,
  CLIENT_ID_HEADER,
  COACH_ACCESS_KEY,
  COACH_LINKS,
  IS_ADMIN_KEY,
  IS_PUBLIC_KEY,
  ROLES_KEY,
  type Accounts,
  type AuthUser,
  type CoachLinks,
  type Role,
} from '../../shared';
import type { AccessTokenPayload } from '../services/auth.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Глобальный guard: без `@Public()` нужен Bearer-токен. Аккаунт читается из
 * базы на каждый запрос: смена кода (sessionsVersion), роль и блокировка
 * действуют сразу.
 *
 * Роли маршрута — `@Roles()`, по умолчанию только `client`. Тренер с
 * заголовком `X-Client-Id` работает от имени своего клиента, но только на
 * маршрутах с `@CoachAccess()`: дальше код видит клиента, а тренера — в
 * `actorId`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    @Inject(ACCOUNTS) private accounts: Accounts,
    @Inject(COACH_LINKS) private links: CoachLinks,
  ) {}

  async canActivate(context: ExecutionContext) {
    const meta = <T>(key: string) =>
      this.reflector.getAllAndOverride<T | undefined>(key, [
        context.getHandler(),
        context.getClass(),
      ]);
    // Админка проверяется своим guard'ом.
    if (meta<boolean>(IS_PUBLIC_KEY) || meta<boolean>(IS_ADMIN_KEY))
      return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

    const payload = await this.jwt
      .verifyAsync<AccessTokenPayload & { aud?: string }>(token)
      .catch(() => null);
    // Токен админки сюда не подходит.
    const account =
      payload && !payload.aud
        ? await this.accounts.findById(payload.sub)
        : null;
    if (
      !payload ||
      !account ||
      account.disabled ||
      account.sessionsVersion !== payload.ver
    ) {
      throw new UnauthorizedException();
    }

    const clientId = request.headers[CLIENT_ID_HEADER];
    if (typeof clientId === 'string' && clientId) {
      const access = meta<'read' | 'write'>(COACH_ACCESS_KEY);
      if (
        account.role !== 'coach' ||
        !access ||
        (access === 'read' && request.method !== 'GET') ||
        !UUID.test(clientId) ||
        !(await this.links.isLinked(account.id, clientId))
      ) {
        throw new ForbiddenException('No access to this client');
      }
      const client = await this.accounts.findById(clientId);
      if (!client) throw new ForbiddenException('No access to this client');
      request.user = {
        id: client.id,
        login: client.login,
        role: 'client',
        actorId: account.id,
      };
      return true;
    }

    const roles = meta<Role[]>(ROLES_KEY) ?? ['client'];
    if (!roles.includes(account.role)) throw new ForbiddenException();
    request.user = { id: account.id, login: account.login, role: account.role };
    return true;
  }
}
