export interface Admin {
  id: string
  login: string
  createdAt: string
}

export interface AdminLoginResult {
  accessToken: string
  admin: Admin
}
