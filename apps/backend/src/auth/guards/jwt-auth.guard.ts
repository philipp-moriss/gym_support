import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import {
  ACCOUNTS,
  IS_PUBLIC_KEY,
  type Accounts,
  type AuthUser,
} from '../../shared';
import type { AccessTokenPayload } from '../services/auth.service';

/**
 * Глобальный guard: без `@Public()` нужен Bearer-токен. Аккаунт читается из
 * базы на каждый запрос: смена кода (sessionsVersion) действует сразу.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    @Inject(ACCOUNTS) private accounts: Accounts,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

    const payload = await this.jwt
      .verifyAsync<AccessTokenPayload>(token)
      .catch(() => null);
    const account = payload ? await this.accounts.findById(payload.sub) : null;
    if (!payload || !account || account.sessionsVersion !== payload.ver) {
      throw new UnauthorizedException();
    }
    request.user = { id: account.id, login: account.login };
    return true;
  }
}
