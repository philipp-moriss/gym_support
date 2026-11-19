import type { Activity, ActivityInput, ActivityKind } from '@/entities/activity'

export const POOLS = [25, 50] as const

/**
 * Поля формы. Числа, которые печатают руками, хранятся строками, чтобы поле
 * можно было стереть. Бассейн: дорожка, сколько раз, мин:сек.
 * Велик: км, ч:мин. Пилатес: минуты.
 */
export interface ActivityFormState {
  kind: ActivityKind
  poolLength: number
  /** Дорожка не 25 и не 50 — показываем поле для своей длины */
  customPool: boolean
  laps: number
  km: string
  hours: string
  minutes: string
  seconds: string
  notes: string
}

const DEFAULTS: Record<ActivityKind, Partial<ActivityFormState>> = {
  swim: { minutes: '30' },
  bike: { km: '20', hours: '1' },
  pilates: { minutes: '45' },
}

const blank = (kind: ActivityKind): ActivityFormState => ({
  kind,
  poolLength: 25,
  customPool: false,
  laps: 20,
  km: '',
  hours: '',
  minutes: '',
  seconds: '',
  notes: '',
  ...DEFAULTS[kind],
})

const str = (n: number) => (n ? String(n) : '')

/** Форма из записи. У бассейна и пилатеса нет часов: всё время — в минутах. */
export function formFromActivity(a: Activity): ActivityFormState {
  const hours = a.kind === 'bike' ? Math.floor(a.durationSec / 3600) : 0
  const pool = a.poolLength ?? 25
  return {
    kind: a.kind,
    poolLength: pool,
    customPool: !(POOLS as readonly number[]).includes(pool),
    laps: a.laps ?? 20,
    km: a.distanceM ? String(a.distanceM / 1000).replace('.', ',') : '',
    hours: str(hours),
    minutes: str(Math.floor((a.durationSec - hours * 3600) / 60)),
    seconds: str(a.durationSec % 60),
    notes: a.notes,
  }
}

/** Новая запись: как в прошлый раз этого вида (без заметки), иначе — разумные значения. */
export function formForNew(
  kind: ActivityKind,
  last?: Activity,
): ActivityFormState {
  return last ? { ...formFromActivity(last), notes: '' } : blank(kind)
}

const int = (s: string) => (s.trim() ? Number(s) : 0)

export const formDurationSec = (f: ActivityFormState) =>
  int(f.hours) * 3600 + int(f.minutes) * 60 + int(f.seconds)

/** Дистанция в метрах; у пилатеса — null. */
export function formDistanceM(f: ActivityFormState) {
  if (f.kind === 'swim') return f.poolLength * f.laps
  if (f.kind === 'bike')
    return Math.round(Number(f.km.replace(',', '.') || 0) * 1000)
  return null
}

/** Что не так с формой — понятной фразой; null — можно сохранять. Границы — как у сервера. */
export function formProblem(f: ActivityFormState): string | null {
  if (f.kind === 'swim') {
    if (f.poolLength < 10 || f.poolLength > 100)
      return 'Дорожка — от 10 до 100 м'
    if (f.laps < 1) return 'Сколько раз проплыл?'
    if (f.laps > 1000) return 'Не больше 1000 раз'
  }
  if (f.kind === 'bike') {
    const m = formDistanceM(f) ?? 0
    if (!Number.isFinite(m) || m < 100) return 'Сколько км проехал?'
    if (m > 500_000) return 'Не больше 500 км'
  }
  if (int(f.seconds) > 59) return 'Секунд — не больше 59'
  if (f.kind === 'bike' && int(f.minutes) > 59) return 'Минут — не больше 59'
  const sec = formDurationSec(f)
  if (sec < 1) return 'Сколько длилась тренировка?'
  if (sec > 86_400) return 'Не больше 24 часов'
  return null
}

export function formToInput(f: ActivityFormState, date: string): ActivityInput {
  const common = {
    date,
    kind: f.kind,
    durationSec: formDurationSec(f),
    notes: f.notes.trim(),
  }
  if (f.kind === 'swim')
    return { ...common, poolLength: f.poolLength, laps: f.laps }
  if (f.kind === 'bike') return { ...common, distanceM: formDistanceM(f) ?? 0 }
  return common
}
