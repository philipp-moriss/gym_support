import type { ExerciseInput, Muscle } from '@/entities/program'
import { normalize, type ParsedRow } from './parse-journal'

/** Мышцы по словам в названии; не угадали — «Кор», пользователь поправит в «Плане». */
const MUSCLE_WORDS: [RegExp, Muscle][] = [
  [/жим.*(лёж|леж|скамь|наклон)|груд|отжим|бабочк|пек.?дек|кроссовер/, 'chest'],
  [/тяга|подтяг|спин|гиперэкст|пуловер/, 'back'],
  [/ягод|мост|отведен|ягодич/, 'glutes'],
  [/присед|ног|выпад|икр|бедр|сведен|разгибан|сгибан|степ/, 'legs'],
  [/плеч|жим.*(стоя|сидя|над голов)|махи|дельт|протяжк|арнольд/, 'shoulders'],
  [/бицепс|трицепс|молот|французск|рук|предплеч/, 'arms'],
  [/осанк|разведен.*живот|лопат|face.?pull/, 'posture'],
  [/планк|пресс|скручив|кор\b|bird|вакуум|подъём ног/, 'core'],
  [/растяж|мобил|дыхан|йог|раскат/, 'mobility'],
  [/бег|вело|кардио|ходьб|эллипс|гребл|скакалк/, 'cardio'],
]

export const guessMuscle = (name: string): Muscle =>
  MUSCLE_WORDS.find(([re]) => re.test(normalize(name)))?.[1] ?? 'core'

/**
 * Черновик упражнения программы по записям из файла. С весом — «от рабочего
 * веса»: база = лучший вес из файла. Без веса — план на 4 недели по последней записи.
 */
export function exerciseFromRows(
  name: string,
  rows: ParsedRow[],
): ExerciseInput {
  const sorted = rows.toSorted((a, b) => a.date.localeCompare(b.date))
  const last = sorted[sorted.length - 1]
  const best = Math.max(0, ...rows.map((r) => r.weight))
  const plan = {
    sets: Math.max(1, last.sets || 3),
    reps: Math.max(1, last.reps || 10),
  }
  return {
    name: name.slice(0, 120),
    short: name.slice(0, 60),
    muscle: guessMuscle(name),
    group: best > 0 ? 'main' : 'extra',
    unit: last.unit,
    perSide: false,
    base: best > 0 ? best : null,
    step: best > 0 ? 2.5 : 0,
    targetSets: plan.sets,
    repsMin: 12,
    repsMax: 15,
    weeks: best > 0 ? null : Array.from({ length: 4 }, () => ({ ...plan })),
    alternativeOf: null,
    tips: [],
    days: [],
  }
}
