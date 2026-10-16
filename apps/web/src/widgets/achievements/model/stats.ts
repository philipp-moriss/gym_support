import { PAIN_LIMIT, volume, type Entry } from '@/entities/entry'
import { addDays, mondayOf, todayIso } from '@/shared/lib'

export type PersonalRecord = { exercise: string; weight: number; date: string }

export function journalStats(entries: Entry[]) {
  const today = todayIso()
  const byDay = new Map<string, number>()
  for (const e of entries)
    byDay.set(e.date, (byDay.get(e.date) ?? 0) + volume(e))

  const days = [...byDay.keys()].sort()
  const best = [...byDay.entries()].reduce<{ date: string; kg: number } | null>(
    (acc, [date, kg]) => (!acc || kg > acc.kg ? { date, kg } : acc),
    null,
  )

  // Личные рекорды: максимальный вес по каждому упражнению.
  const records = new Map<string, PersonalRecord>()
  for (const e of entries) {
    if (e.weight <= 0) continue
    const key = e.exerciseId ?? e.exercise
    const cur = records.get(key)
    if (!cur || e.weight > cur.weight)
      records.set(key, { exercise: e.exercise, weight: e.weight, date: e.date })
  }
  // Рекорд побит, если он поставлен не в первую тренировку с этим упражнением.
  const firstDay = new Map<string, string>()
  for (const e of entries) {
    const key = e.exerciseId ?? e.exercise
    const cur = firstDay.get(key)
    if (!cur || e.date < cur) firstDay.set(key, e.date)
  }
  const beaten = [...records.entries()].filter(
    ([key, r]) => r.date > (firstDay.get(key) ?? r.date),
  ).length

  // Недели подряд с тренировками: от текущей (или прошлой, если в этой ещё не было).
  const weeks = new Set(days.map(mondayOf))
  let monday = mondayOf(today)
  if (!weeks.has(monday)) monday = addDays(monday, -7)
  let streak = 0
  while (weeks.has(monday)) {
    streak++
    monday = addDays(monday, -7)
  }

  // Тренировок подряд без боли 4+ (с конца).
  let painFree = 0
  for (const date of [...days].reverse()) {
    if (entries.some((e) => e.date === date && (e.pain ?? 0) >= PAIN_LIMIT))
      break
    painFree++
  }

  return {
    todayKg: byDay.get(today) ?? 0,
    totalKg: [...byDay.values()].reduce((s, v) => s + v, 0),
    workouts: days.length,
    sets: entries.reduce((s, e) => s + e.sets, 0),
    best,
    records: [...records.values()].sort((a, b) => b.weight - a.weight),
    beaten,
    streak,
    painFree,
  }
}

export type Stats = ReturnType<typeof journalStats>

export type Badge = {
  id: string
  emoji: string
  title: string
  text: string
  unlocked: boolean
}

export function badges(s: Stats): Badge[] {
  return [
    {
      id: 'first',
      emoji: '🎉',
      title: 'Первая тренировка',
      text: 'Начало положено',
      unlocked: s.workouts >= 1,
    },
    {
      id: 'ten',
      emoji: '🔟',
      title: '10 тренировок',
      text: 'Привычка формируется',
      unlocked: s.workouts >= 10,
    },
    {
      id: 'fifty',
      emoji: '🏅',
      title: '50 тренировок',
      text: 'Это уже образ жизни',
      unlocked: s.workouts >= 50,
    },
    {
      id: 'streak4',
      emoji: '🔥',
      title: '4 недели подряд',
      text: 'Ни одной пропущенной недели',
      unlocked: s.streak >= 4,
    },
    {
      id: 'ton-day',
      emoji: '💪',
      title: 'Тонна за день',
      text: '1 000 кг за тренировку',
      unlocked: (s.best?.kg ?? 0) >= 1000,
    },
    {
      id: 'five-ton-day',
      emoji: '🏋️',
      title: '5 тонн за день',
      text: 'Как поднять бегемота дважды',
      unlocked: (s.best?.kg ?? 0) >= 5000,
    },
    {
      id: 'ten-tons',
      emoji: '⛰️',
      title: '10 тонн всего',
      text: 'Почти автобус',
      unlocked: s.totalKg >= 10_000,
    },
    {
      id: 'hundred-tons',
      emoji: '🌋',
      title: '100 тонн всего',
      text: 'Две трети синего кита',
      unlocked: s.totalKg >= 100_000,
    },
    {
      id: 'record',
      emoji: '🚀',
      title: 'Личный рекорд',
      text: 'Побил свой лучший вес',
      unlocked: s.beaten >= 1,
    },
    {
      id: 'pain-free',
      emoji: '🧘',
      title: 'Спина в порядке',
      text: '5 тренировок подряд без боли 4+',
      unlocked: s.painFree >= 5,
    },
  ]
}
