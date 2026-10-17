import {
  createParamDecorator,
  SetMetadata,
  type ExecutionContext,
} from '@nestjs/common';
import type { AuthUser, Role } from './auth-user';

export const IS_PUBLIC_KEY = 'auth:isPublic';
export const IS_ADMIN_KEY = 'auth:isAdmin';
export const ROLES_KEY = 'auth:roles';
export const COACH_ACCESS_KEY = 'auth:coachAccess';

/** Заголовок, которым тренер выбирает клиента, чьи данные читает или правит. */
export const CLIENT_ID_HEADER = 'x-client-id';

/**
 * Доступ по умолчанию закрыт: глобальный guard из `auth` требует токен.
 * `@Public()` открывает эндпоинт без входа (регистрация, вход, health).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Маршрут админки: пользовательский guard его пропускает, проверку делает
 * guard модуля `admin` (свой токен, `aud: 'admin'`).
 */
export const AdminOnly = () => SetMetadata(IS_ADMIN_KEY, true);

/** Какие роли пускать. Без пометки — только `client`. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Тренер может вызвать маршрут от имени своего клиента (`X-Client-Id`).
 * `'read'` — только GET, `'write'` — любые методы.
 */
export const CoachAccess = (mode: 'read' | 'write') =>
  SetMetadata(COACH_ACCESS_KEY, mode);

/** Текущий пользователь из контекста авторизации. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<{ user: AuthUser }>().user,
);
