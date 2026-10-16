import { env } from '@/shared/config'
import { refreshSession, session } from './session'

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

async function send(path: string, init?: RequestInit) {
  const isForm = init?.body instanceof FormData
  const token = session.accessToken
  return fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
}

/** Запрос с одной попыткой обновить access-токен; не-2xx — ApiError. */
async function sendChecked(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let res = await send(path, init)
  // Access-токен истёк или его нет после перезагрузки: одна попытка обновить.
  if (
    res.status === 401 &&
    !/^\/auth\/(login|register|refresh|logout)/.test(path)
  ) {
    if (await refreshSession()) res = await send(path, init)
    else if (session.hasSession()) session.notifyExpired()
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | ({
          message?: string | string[]
        } & Record<string, unknown>)
      | null
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? res.statusText)
    throw new ApiError(res.status, message, body)
  }
  return res
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await sendChecked(path, init)
  // 204 No Content (например, DELETE) — тела нет.
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}
