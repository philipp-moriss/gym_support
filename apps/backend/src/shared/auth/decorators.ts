import {
  createParamDecorator,
  SetMetadata,
  type ExecutionContext,
} from '@nestjs/common';
import type { AuthUser } from './auth-user';

export const IS_PUBLIC_KEY = 'auth:isPublic';

/**
 * Доступ по умолчанию закрыт: глобальный guard из `auth` требует токен.
 * `@Public()` открывает эндпоинт без входа (регистрация, вход, health).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Текущий пользователь из контекста авторизации. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<{ user: AuthUser }>().user,
);
