/** Роль аккаунта; ключи совпадают с бэкендом (shared/auth). */
export type Role = 'client' | 'coach'

/** Ответ `/auth/me` и поле `user` при входе (Swagger: тег auth). */
export interface Me {
  id: string
  login: string
  /** client — тренируется сам, coach — кабинет тренера. */
  role: Role
  /** Имя (у тренеров и клиентов, которых завёл тренер). */
  name: string | null
  /** 8 — вход одним кодом, 6 — старый код: входят по логину, как с паролем. */
  codeDigits: 6 | 8
  createdAt: string
}

export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: Me
}
