import { useSyncExternalStore } from 'react'

/** Событие Chrome/Android: системное окно «Установить приложение». В типах DOM его нет. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

// Событие приходит рано, ещё до первого рендера, — ловим его при загрузке модуля.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    notify()
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

/** Уже открыто как приложение с экрана «Домой». */
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export type Platform = 'ios' | 'android' | 'other'

export function platform(): Platform {
  const ua = navigator.userAgent
  // iPadOS притворяется Mac'ом, но у него есть тач.
  if (
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  )
    return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

export function usePwaInstall() {
  const canPrompt = useSyncExternalStore(subscribe, () => !!deferred)
  const justInstalled = useSyncExternalStore(subscribe, () => installed)
  return {
    canPrompt,
    installed: justInstalled || isStandalone(),
    platform: platform(),
    async prompt() {
      if (!deferred) return false
      const event = deferred
      deferred = null
      await event.prompt()
      const { outcome } = await event.userChoice
      notify()
      return outcome === 'accepted'
    },
  }
}
