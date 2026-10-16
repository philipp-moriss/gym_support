import type { ReactNode } from 'react'

/** Плавный аккордеон: grid 0fr → 1fr анимирует высоту без замеров. */
export function Collapse({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  return (
    <div className="collapse-grid" data-open={open}>
      <div>{children}</div>
    </div>
  )
}
