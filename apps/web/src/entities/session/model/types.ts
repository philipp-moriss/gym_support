/** Ответ `/auth/me` и поле `user` при входе (Swagger: тег auth). */
export interface Me {
  id: string
  login: string
  createdAt: string
}

export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: Me
}
