import { env } from '@/shared/config'

/**
 * Токены сессии. Access-токен живёт только в памяти вкладки, refresh — в
 * localStorage, чтобы вход переживал перезагрузку. Токены никуда больше не
 * пишутся и в URL не попадают.
 */
const REFRESH_KEY = 'gym.refreshToken'

export interface SessionTokens {
  accessToken: string
  refreshToken: string
}

let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null
const expiredListeners = new Set<() => void>()

function readRefresh(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

function writeRefresh(token: string | null) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token)
    else localStorage.removeItem(REFRESH_KEY)
  } catch {
    // Приватный режим: вход не переживёт перезагрузку.
  }
}

export const session = {
  set(tokens: SessionTokens) {
    accessToken = tokens.accessToken
    writeRefresh(tokens.refreshToken)
  },
  clear() {
    accessToken = null
    writeRefresh(null)
  },
  get accessToken() {
    return accessToken
  },
  get refreshToken() {
    return readRefresh()
  },
  hasSession: () => !!accessToken || !!readRefresh(),
  /** Сессия закончилась и обновить её не удалось: пора на экран входа. */
  onExpired(listener: () => void) {
    expiredListeners.add(listener)
    return () => void expiredListeners.delete(listener)
  },
  notifyExpired() {
    session.clear()
    expiredListeners.forEach((listener) => listener())
  },
}

async function exchangeRefreshToken(): Promise<boolean> {
  const refreshToken = readRefresh()
  if (!refreshToken) return false
  // Нет сети — бросаем ошибку дальше: это не «сессия истекла», выходить не нужно.
  const res = await fetch(`${env.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) return false
  session.set((await res.json()) as SessionTokens)
  return true
}

/**
 * Обновляет access-токен. Refresh-токен одноразовый, а повтор старого сервер
 * считает кражей и закрывает все сессии — поэтому обновление идёт под
 * межвкладочной блокировкой и всегда с самым свежим токеном из хранилища.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (
    navigator.locks
      ? navigator.locks.request('gym.refresh', exchangeRefreshToken)
      : exchangeRefreshToken()
  ).finally(() => {
    refreshing = null
  })
  return refreshing
}
