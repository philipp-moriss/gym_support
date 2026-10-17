/**
 * Тренер открыл клиента: запросы программы и дневника идут от имени клиента
 * (заголовок `X-Client-Id`). Сервер пускает так только к своим клиентам и
 * только на эти разделы — остальные запросы заголовок не получают.
 */
let clientId: string | null = null

const SCOPED = /^\/(program|journal)(\/|\?|$)/

export const actingAs = {
  get: () => clientId,
  set(id: string | null) {
    clientId = id
  },
  headerFor: (path: string): Record<string, string> =>
    clientId && SCOPED.test(path) ? { 'X-Client-Id': clientId } : {},
}
