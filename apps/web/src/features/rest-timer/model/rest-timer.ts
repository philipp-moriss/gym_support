import { useEffect, useState, useSyncExternalStore } from 'react'
import { haptic, storage } from '@/shared/lib'

/**
 * Таймер отдыха между подходами. Конец хранится временем, а не счётчиком:
 * переживает перезагрузку и сворачивание приложения. Длительность — своя на
 * устройстве (60 / 90 / 120 / 180 с), меняется тапом по таймеру.
 */
export const REST_OPTIONS = [60, 90, 120, 180]
const END_KEY = 'gym.rest-end'
const LEN_KEY = 'gym.rest-seconds'

type State = { endsAt: number | null; total: number }

let state: State = {
  endsAt: storage.get<number>(END_KEY),
  total: storage.get<number>(LEN_KEY) ?? 90,
}
const listeners = new Set<() => void>()
const set = (next: State) => {
  state = next
  if (next.endsAt) storage.set(END_KEY, next.endsAt)
  else storage.remove(END_KEY)
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

/** Звук в конце: AudioContext оживляем в момент нажатия — иначе iOS его не пустит. */
let audio: AudioContext | null = null
function unlockAudio() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    audio = null
  }
}
function beep() {
  if (!audio) return
  const t = audio.currentTime
  for (const [i, freq] of [880, 1320].entries()) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t + i * 0.18)
    gain.gain.exponentialRampToValueAtTime(0.25, t + i * 0.18 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 0.16)
    osc.connect(gain).connect(audio.destination)
    osc.start(t + i * 0.18)
    osc.stop(t + i * 0.18 + 0.17)
  }
}

export const restTimer = {
  /** Запуск — из обработчика нажатия («Сделано», отметка подхода). */
  start(seconds = state.total) {
    unlockAudio()
    set({ endsAt: Date.now() + seconds * 1000, total: seconds })
  },
  add(seconds: number) {
    if (state.endsAt)
      set({
        ...state,
        endsAt: state.endsAt + seconds * 1000,
        total: state.total + seconds,
      })
  },
  stop() {
    set({ ...state, endsAt: null })
  },
  /** Следующая длительность по кругу; запомнить и начать заново. */
  cycle() {
    const base = storage.get<number>(LEN_KEY) ?? 90
    const next =
      REST_OPTIONS[(REST_OPTIONS.indexOf(base) + 1) % REST_OPTIONS.length]
    storage.set(LEN_KEY, next)
    restTimer.start(next)
  },
  finish() {
    set({ ...state, endsAt: null })
    haptic('success')
    beep()
  },
}

/** Оставшиеся секунды; null — таймер не идёт. justFinished — несколько секунд после конца. */
export function useRestTimer() {
  const { endsAt, total } = useSyncExternalStore(subscribe, () => state)
  const [now, setNow] = useState(() => Date.now())
  const [finishedAt, setFinishedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!endsAt) return
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (t >= endsAt) {
        restTimer.finish()
        setFinishedAt(t)
      }
    }
    tick()
    const id = setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [endsAt])

  useEffect(() => {
    if (!finishedAt) return
    const id = setTimeout(() => setFinishedAt(null), 4000)
    return () => clearTimeout(id)
  }, [finishedAt])

  return {
    remaining: endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : null,
    total,
    justFinished: !endsAt && !!finishedAt,
  }
}
