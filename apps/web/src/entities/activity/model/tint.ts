import type { ActivityKind } from './types'

/** Цвет вида из палитры «Flying Papers»: бассейн — небо, велик — масло, пилатес — сирень. */
export const ACTIVITY_TINT: Record<ActivityKind, string> = {
  swim: 'bg-sky',
  bike: 'bg-buttery-yellow',
  pilates: 'bg-lilac',
}
