import { storage } from '@/shared/lib'
import type { Entry, EntryInput } from './types'

/**
 * Записи, сделанные без сети: лежат на телефоне, пока не уйдут на сервер.
 * Очередь своя у каждого аккаунта — владельца выставляет приложение после входа.
 */
export interface PendingEntry {
  id: string
  createdAt: string
  input: EntryInput
}

let owner: string | null = null
let cache: PendingEntry[] = []
const listeners = new Set<() => void>()
const key = () => `gym.pending:${owner}`

function save(next: PendingEntry[]) {
  cache = next
  if (owner) storage.set(key(), next)
  listeners.forEach((l) => l())
}

export const pendingEntries = {
  setOwner(userId: string | null) {
    if (userId === owner) return
    owner = userId
    cache = userId ? (storage.get<PendingEntry[]>(key()) ?? []) : []
    listeners.forEach((l) => l())
  },
  list: () => cache,
  add(input: EntryInput): PendingEntry {
    const item = {
      id: `pending-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      input,
    }
    save([...cache, item])
    return item
  },
  update(id: string, patch: Partial<EntryInput>) {
    save(
      cache.map((p) =>
        p.id === id ? { ...p, input: { ...p.input, ...patch } } : p,
      ),
    )
  },
  remove(id: string) {
    save(cache.filter((p) => p.id !== id))
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => void listeners.delete(listener)
  },
}

export const isPendingId = (id: string) => id.startsWith('pending-')

export const pendingAsEntry = (p: PendingEntry): Entry => ({
  ...p.input,
  id: p.id,
  createdAt: p.createdAt,
  pending: true,
})
