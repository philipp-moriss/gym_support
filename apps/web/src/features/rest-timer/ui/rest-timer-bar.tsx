import { BellRing, Timer, X } from 'lucide-react'
import { HapticOverlay } from '@/shared/ui'
import { restTimer, useRestTimer } from '../model/rest-timer'

const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/**
 * Плашка над меню, пока идёт отдых: обратный отсчёт с полосой, «+15» и стоп.
 * Тап по времени — другая длительность (60 → 90 → 120 → 180 с), она запоминается.
 */
export function RestTimerBar() {
  const { remaining, total, justFinished } = useRestTimer()

  if (justFinished)
    return (
      <div
        className="pop-in flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 font-bold text-ink"
        role="status"
      >
        <BellRing className="size-5" />
        Отдых окончен — следующий подход
      </div>
    )
  if (remaining === null) return null

  const progress = total ? 1 - remaining / total : 0
  return (
    <div
      className="pop-in relative flex items-center gap-1 overflow-hidden rounded-full bg-card p-1 text-card-foreground"
      role="timer"
      aria-label={`Отдых: осталось ${mmss(remaining)}`}
    >
      <span
        className="absolute inset-y-0 left-0 bg-matcha-cream transition-[width] duration-300 ease-linear"
        style={{ width: `${progress * 100}%` }}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => restTimer.cycle()}
        className="relative flex h-9 items-center gap-2 rounded-full px-3 font-mono text-lg font-bold tabular-nums"
        aria-label="Сменить длительность отдыха"
      >
        <Timer className="size-4" />
        {mmss(remaining)}
        <HapticOverlay />
      </button>
      <button
        type="button"
        onClick={() => restTimer.add(15)}
        className="relative h-9 rounded-full bg-ink/10 px-3 text-sm font-bold"
      >
        +15 с
        <HapticOverlay />
      </button>
      <button
        type="button"
        onClick={() => restTimer.stop()}
        className="relative grid size-9 place-items-center rounded-full"
        aria-label="Остановить отдых"
      >
        <X className="size-4" />
        <HapticOverlay />
      </button>
    </div>
  )
}
