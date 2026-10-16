/**
 * Тактильный отклик. Android (и другие браузеры с Vibration API) — короткая
 * вибрация. Safari на iPhone вибрацию не поддерживает, но с iOS 18 щелчок по
 * системному переключателю (<input type="checkbox" switch>) даёт лёгкий «тик» —
 * им и пользуемся. Работает только внутри жеста пользователя (клик, нажатие).
 */
type Kind = 'tap' | 'error'

const patterns: Record<Kind, number | number[]> = {
  tap: 8,
  error: [40, 60, 40],
}

let iosSwitch: HTMLLabelElement | null = null

const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)

function iosTick() {
  if (!iosSwitch) {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText =
      'position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0;pointer-events:none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.tabIndex = -1
    label.append(input)
    document.body.append(label)
    iosSwitch = label
  }
  iosSwitch.click()
}

export function haptic(kind: Kind = 'tap') {
  if (typeof navigator === 'undefined') return
  if ('vibrate' in navigator) {
    navigator.vibrate(patterns[kind])
    return
  }
  if (!isIos()) return
  iosTick()
  // Второй тик для ошибки: внутри того же жеста iOS его ещё пропускает.
  if (kind === 'error') setTimeout(iosTick, 120)
}
