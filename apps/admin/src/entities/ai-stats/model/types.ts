/** Анализы ИИ за последние 30 дней. */
export interface AiStats {
  byCoach: {
    coachId: string
    coachName: string
    total: number
    ready: number
    failed: number
  }[]
  failures: {
    id: string
    coachId: string
    coachName: string
    clientId: string
    clientName: string
    error: string
    createdAt: string
  }[]
}
