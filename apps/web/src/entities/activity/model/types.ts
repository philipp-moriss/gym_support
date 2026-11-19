/** Копия бэкенда (journal, Swagger: тег journal, /journal/activities). */
export type ActivityKind = 'swim' | 'bike' | 'pilates'

export const ACTIVITY_KINDS: ActivityKind[] = ['swim', 'bike', 'pilates']

export interface Activity {
  id: string
  createdAt: string
  /** YYYY-MM-DD */
  date: string
  kind: ActivityKind
  /** Бассейн: длина дорожки, м */
  poolLength: number | null
  /** Бассейн: сколько раз проплыл дорожку */
  laps: number | null
  /** м; у бассейна — poolLength × laps; у пилатеса — null */
  distanceM: number | null
  durationSec: number
  notes: string
}

export interface ActivityInput {
  date: string
  kind: ActivityKind
  poolLength?: number
  laps?: number
  /** Только велик */
  distanceM?: number
  durationSec: number
  notes?: string
}

/** Правка: вид не меняется. */
export type ActivityPatch = Partial<Omit<ActivityInput, 'kind'>>

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  swim: 'Бассейн',
  bike: 'Велосипед',
  pilates: 'Пилатес',
}
