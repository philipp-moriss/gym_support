/** Дата и время из timestamptz: «17 окт 2026, 12:05». */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/** Дата из timestamptz: «17 окт 2026». */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

/** День YYYY-MM-DD (без пояса): «16 окт». */
export const formatDay = (day: string) =>
  new Date(`${day}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
