/** localStorage, который не падает в приватном режиме и при битом JSON. */
export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Хранилище недоступно — значение живёт до перезагрузки.
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key)
    } catch {
      // нечего удалять
    }
  },
}
