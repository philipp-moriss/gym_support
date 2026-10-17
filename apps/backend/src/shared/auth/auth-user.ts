/** Роли аккаунта. Ключи совпадают с клиентом (apps/web, entities/session). */
export const ROLES = ['client', 'coach'] as const;
export type Role = (typeof ROLES)[number];

/**
 * Текущий пользователь запроса. Кладётся guard'ом из `auth` в `request.user`.
 * Чьи данные читать и менять, берётся только отсюда, а не из параметров запроса.
 *
 * Тренер, работающий «от имени» клиента (`X-Client-Id`), видится здесь клиентом:
 * `id` — клиент, `actorId` — тренер. Guard пускает так только на маршруты с
 * `@CoachAccess()` и только к своему клиенту.
 */
export interface AuthUser {
  id: string;
  login: string;
  role: Role;
  /** Кто на самом деле делает запрос, если не сам владелец данных. */
  actorId?: string;
}
