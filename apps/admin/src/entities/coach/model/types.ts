/** Аккаунт тренера, как его отдают PATCH и POST. */
export interface CoachAccount {
  id: string
  login: string
  name: string | null
  disabled: boolean
  createdAt: string
}

export interface Coach extends CoachAccount {
  /** Анализов ИИ в сутки; null — общий лимит по умолчанию. */
  aiDailyLimit: number | null
  /** Сколько клиентов закреплено. */
  clients: number
  analyses30d: number
}

export interface CreatedCoach {
  coach: CoachAccount
  /** 8 цифр, в открытом виде только в этом ответе. */
  code: string
}

export const coachName = (c: { name: string | null; login: string }) =>
  c.name ?? c.login
