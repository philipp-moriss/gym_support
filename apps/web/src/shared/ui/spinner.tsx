import { LoaderCircle } from 'lucide-react'
import { cn } from '@/shared/lib'

export function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      className={cn('animate-spin', className)}
      aria-label="Загрузка"
    />
  )
}
