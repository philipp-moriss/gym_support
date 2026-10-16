import type { Muscle } from './types'

export const muscles: Record<Muscle, { label: string; color: string }> = {
  chest: { label: 'Грудь', color: 'var(--bubblegum-pink)' },
  back: { label: 'Спина', color: 'var(--dusk-violet)' },
  glutes: { label: 'Ягодицы', color: 'var(--buttery-yellow)' },
  legs: { label: 'Ноги', color: 'var(--matcha-cream)' },
  shoulders: { label: 'Плечи', color: 'var(--lilac)' },
  arms: { label: 'Руки', color: 'var(--bubblegum-pink)' },
  posture: { label: 'Осанка', color: 'var(--sky)' },
  core: { label: 'Кор', color: 'var(--hi-vis-yellow)' },
  mobility: { label: 'Мобильность', color: 'var(--lilac)' },
  cardio: { label: 'Кардио', color: 'var(--sky)' },
}
