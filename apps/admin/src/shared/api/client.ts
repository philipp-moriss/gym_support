import { env } from '@/shared/config'
import { adminToken } from './token'

export class ApiError extends Error {
  readonly status: number
  /** Тело ответа целиком: например, `retryAfterSec` при блокировке входа. */
  readonly body: Record<string, unknown> | null

  constructor(
    status: number,
    message: string,
    body: Record<string, unknown> | null = null,
  ) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = adminToken.get()
  const res = await fetch(`${env.apiUrl}/admin${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    // 401 на входе — неверный пароль, а не истёкшая сессия.
    if (res.status === 401 && path !== '/auth/login') adminToken.notifyExpired()
    const body = (await res.json().catch(() => null)) as
      ({ message?: string | string[] } & Record<string, unknown>) | null
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? res.statusText)
    throw new ApiError(res.status, message, body)
  }
  // 204 No Content — тела нет.
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** Все пути — относительно /api/admin. */
export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
}

/** Текст ошибки для экрана: сообщение API или общий запасной. */
export const errorText = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : 'Сервер недоступен. Проверь интернет.'
