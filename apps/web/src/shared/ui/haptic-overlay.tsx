import { isIos } from '@/shared/lib'

const ios = isIos()

/**
 * Тактильный «тик» на iPhone (iOS 18+): прозрачный системный переключатель
 * <input type="checkbox" switch> поверх кнопки. Палец нажимает на него — iOS
 * щёлкает, а событие click всплывает к кнопке, и она срабатывает как обычно.
 * Родитель должен быть position: relative. На других устройствах — ничего.
 */
export function HapticOverlay({ disabled }: { disabled?: boolean }) {
  if (!ios) return null
  return (
    <input
      type="checkbox"
      ref={(el) => el?.setAttribute('switch', '')}
      aria-hidden="true"
      tabIndex={-1}
      disabled={disabled}
      className="absolute inset-0 m-0 size-full cursor-pointer opacity-0 [clip-path:inset(0_round_999px)] [-webkit-tap-highlight-color:transparent]"
      style={{ touchAction: 'pan-x pan-y' }}
    />
  )
}
