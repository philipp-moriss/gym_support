export interface Client {
  id: string
  login: string
  name: string | null
  disabled: boolean
  createdAt: string
  coach: { id: string; name: string } | null
  /** День последней тренировки YYYY-MM-DD. */
  lastWorkout: string | null
  workouts7d: number
}
