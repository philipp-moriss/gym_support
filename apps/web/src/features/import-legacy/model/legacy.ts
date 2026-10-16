import {
  legacyEffort,
  type Draft,
  type EntryInput,
  type Feel,
} from '@/entities/entry'
import { storage, todayIso } from '@/shared/lib'

/**
 * Данные прежней версии сайта: всё жило в localStorage этого браузера.
 * Ключи и формат — из старого src/lib/entries.ts, их не меняем.
 */
const KEYS = {
  entries: 'training-journal:v1',
  settings: 'training-settings:v1',
  drafts: 'training-drafts:v1',
}

type LegacyEntry = {
  id: string
  date: string
  week?: number
  exerciseId?: string
  exercise: string
  sets: number
  reps: number
  weight: number
  pain?: number
  effort?: number
  feel?: Feel
  notes?: string
}

type LegacySettings = {
  startDate?: string
  bases?: Record<string, number>
  swaps?: Record<string, string>
  resetAt?: string
}

type LegacyDrafts = {
  date?: string
  items?: Record<string, Partial<Draft> & { feel?: Feel }>
}

export type LegacyData = {
  entries: EntryInput[]
  settings: LegacySettings | null
  /** Сегодняшние черновики; вчерашние не переносим — они бы всё равно не показались. */
  drafts: Record<string, Draft>
}

const isDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const int = (v: unknown, fallback = 0) =>
  Number.isFinite(Number(v)) ? Math.round(Number(v)) : fallback
const score = (v: unknown) =>
  v === undefined || v === null || !Number.isFinite(Number(v))
    ? null
    : Math.min(10, Math.max(0, int(v)))

/** Что есть в этом браузере от старой версии; null — переносить нечего. */
export function readLegacy(): LegacyData | null {
  const rawEntries = storage.get<LegacyEntry[]>(KEYS.entries)
  const settings = storage.get<LegacySettings>(KEYS.settings)
  const rawDrafts = storage.get<LegacyDrafts>(KEYS.drafts)

  const entries: EntryInput[] = (Array.isArray(rawEntries) ? rawEntries : [])
    .filter(
      (e) =>
        e &&
        isDate(e.date) &&
        typeof e.exercise === 'string' &&
        e.exercise.trim(),
    )
    .map((e) => ({
      date: e.date,
      week: e.week && e.week > 0 ? int(e.week) : null,
      exerciseId: e.exerciseId ?? null,
      exercise: e.exercise.trim().slice(0, 160),
      sets: Math.max(0, int(e.sets)),
      reps: Math.max(0, int(e.reps)),
      weight: Math.max(0, Number(e.weight) || 0),
      pain: score(e.pain),
      // «Как пошло» ранних версий → сложность, как делала старая миграция.
      effort: score(e.effort) ?? (e.feel ? legacyEffort[e.feel] : null),
      notes: typeof e.notes === 'string' ? e.notes : '',
    }))
    // Старый список хранил новые записи первыми; на сервер отдаём по порядку.
    .reverse()

  const drafts: Record<string, Draft> = {}
  if (rawDrafts?.date === todayIso() && rawDrafts.items) {
    for (const [id, d] of Object.entries(rawDrafts.items)) {
      drafts[id] = {
        weight: Number(d.weight) || 0,
        sets: int(d.sets, 1),
        reps: int(d.reps, 1),
        pain: score(d.pain) ?? 0,
        effort: score(d.effort) ?? (d.feel ? legacyEffort[d.feel] : 5),
        notes: typeof d.notes === 'string' ? d.notes : '',
      }
    }
  }

  const hasSettings =
    !!settings &&
    (Object.keys(settings.bases ?? {}).length > 0 || isDate(settings.startDate))
  if (!entries.length && !hasSettings && !Object.keys(drafts).length)
    return null
  return { entries, settings: hasSettings ? settings : null, drafts }
}

/** Решение по переносу помним для каждого аккаунта: не спрашиваем дважды. */
const flagKey = (userId: string) => `gym.legacy:${userId}`
export const legacyFlag = {
  get: (userId: string) =>
    storage.get<'imported' | 'dismissed'>(flagKey(userId)),
  set: (userId: string, value: 'imported' | 'dismissed') =>
    storage.set(flagKey(userId), value),
}

export function legacySettingsPatch(s: LegacySettings) {
  return {
    ...(isDate(s.startDate) ? { startDate: s.startDate } : {}),
    ...(s.swaps ? { swaps: s.swaps } : {}),
    ...(isDate(s.resetAt) ? { resetAt: s.resetAt } : {}),
  }
}
