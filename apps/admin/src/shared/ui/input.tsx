import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/shared/lib'

const field =
  'w-full min-w-0 rounded-md border-2 border-input bg-card px-3 text-[16px] text-card-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-ring/20 disabled:opacity-60'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn('h-11', field, className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea className={cn('min-h-20 py-2', field, className)} {...props} />
  )
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn('h-11 cursor-pointer pr-8', field, className)}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      <span className="mono-label text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
    </label>
  )
}
