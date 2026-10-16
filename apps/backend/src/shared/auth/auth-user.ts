/**
 * Текущий пользователь запроса. Кладётся guard'ом из `auth` в `request.user`.
 * Чьи данные читать и менять, берётся только отсюда, а не из параметров запроса.
 */
export interface AuthUser {
  id: string;
  login: string;
}
