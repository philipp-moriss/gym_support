import type {
  Activity,
  ActivityInput,
  ActivityKind,
} from '@/entities/activity'

/** Поля формы. Бассейн: дорожка, круги, мин и сек. Велик: км, ч и мин. */
export interface ActivityFormState {
  kind: ActivityKind
  poolLength: number
  laps: number
  km: number
  hours: number
  minutes: number
  seconds: number
  notes: string
}

export const emptyForm = (kind: ActivityKind): ActivityFormState => ({
  kind,
  poolLength: 25,
  laps: 20,
  km: 20,
  hours: kind === 'bike' ? 1 : 0,
  minutes: kind === 'swim' ? 30 : 0,
  seconds: 0,
  notes: '',
})

export function formFromActivity(a: Activity): ActivityFormState {
  return {
    kind: a.kind,
    poolLength: a.poolLength ?? 25,
    laps: a.laps ?? 20,
    km: a.distanceM / 1000,
    hours: Math.floor(a.durationSec / 3600),
    minutes: Math.floor((a.durationSec % 3600) / 60),
    seconds: a.durationSec % 60,
    notes: a.notes,
  }
}

export const formDurationSec = (f: ActivityFormState) =>
  f.hours * 3600 + f.minutes * 60 + f.seconds

export const formDistanceM = (f: ActivityFormState) =>
  f.kind === 'swim' ? f.poolLength * f.laps : Math.round(f.km * 1000)

/** Те же границы, что у сервера. */
export function formValid(f: ActivityFormState) {
  const sec = formDurationSec(f)
  if (sec < 1 || sec > 86_400) return false
  if (f.kind === 'swim')
    return (
      f.poolLength >= 10 && f.poolLength <= 100 && f.laps >= 1 && f.laps <= 1000
    )
  const m = formDistanceM(f)
  return m >= 100 && m <= 500_000
}

export function formToInput(f: ActivityFormState, date: string): ActivityInput {
  const common = {
    date,
    kind: f.kind,
    durationSec: formDurationSec(f),
    notes: f.notes.trim(),
  }
  return f.kind === 'swim'
    ? { ...common, poolLength: f.poolLength, laps: f.laps }
    : { ...common, distanceM: formDistanceM(f) }
}
