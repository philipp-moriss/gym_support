/** Даты без времени, YYYY-MM-DD, в поясе пользователя. */
export const toIso = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
export const fromIso = (iso: string) => new Date(`${iso}T00:00:00`)
export const todayIso = () => toIso(new Date())
/** 0 — понедельник */
export const weekday = (iso: string) => (fromIso(iso).getDay() + 6) % 7
export const mondayOf = (iso: string) => addDays(iso, -weekday(iso))
export const addDays = (iso: string, days: number) => {
  const d = fromIso(iso)
  d.setDate(d.getDate() + days)
  return toIso(d)
}

export const weekdayShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const weekdayLong = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
]

export const formatDay = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  fromIso(iso).toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    ...opts,
  })
