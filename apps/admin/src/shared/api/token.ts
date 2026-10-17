/**
 * Токен админа: в sessionStorage — живёт до закрытия вкладки, refresh нет
 * (TTL 12 ч). В URL и localStorage не попадает.
 */
const KEY = 'gym.admin.token'

let memory: string | null = null
const expiredListeners = new Set<() => void>()

export const adminToken = {
  get(): string | null {
    try {
      return sessionStorage.getItem(KEY)
    } catch {
      return memory
    }
  },
  set(token: string) {
    memory = token
    try {
      sessionStorage.setItem(KEY, token)
    } catch {
      // Хранилище недоступно — токен живёт в памяти вкладки.
    }
  },
  clear() {
    memory = null
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      // нечего удалять
    }
  },
  /** Сервер ответил 401: токен истёк или админа больше нет. */
  onExpired(listener: () => void) {
    expiredListeners.add(listener)
    return () => void expiredListeners.delete(listener)
  },
  notifyExpired() {
    adminToken.clear()
    expiredListeners.forEach((listener) => listener())
  },
}
