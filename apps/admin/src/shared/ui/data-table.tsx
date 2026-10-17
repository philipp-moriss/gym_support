import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  /** Классы ячейки таблицы (ширина, выравнивание). */
  className?: string
  /** На телефоне — заголовок карточки, без подписи. */
  primary?: boolean
}

/**
 * Таблица на широком экране; на телефоне — стопка карточек «подпись: значение».
 * Так страница никогда не ездит вбок.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = 'Пока пусто',
  rowClassName,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  empty?: string
  rowClassName?: (row: T) => string | undefined
}) {
  if (!rows.length)
    return (
      <div className="rounded-md bg-card p-6 text-center text-muted-foreground">
        {empty}
      </div>
    )

  const primary = columns.find((c) => c.primary)
  const rest = columns.filter((c) => c !== primary)

  return (
    <>
      <div className="hidden overflow-x-auto rounded-md bg-card text-card-foreground md:block">
        <table className="w-full border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-b-2 border-border">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'mono-label px-4 py-3 font-normal whitespace-nowrap text-muted-foreground',
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  'border-b border-border last:border-0',
                  rowClassName?.(row),
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn('px-4 py-3 align-middle', c.className)}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className={cn(
              'flex flex-col gap-3 rounded-md bg-card p-4 text-card-foreground',
              rowClassName?.(row),
            )}
          >
            {primary && (
              <div className="text-[17px] font-bold">{primary.cell(row)}</div>
            )}
            <dl className="flex flex-col gap-2.5">
              {rest.map((c) => (
                <div
                  key={c.key}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1"
                >
                  {c.header && (
                    <dt className="mono-label text-muted-foreground">
                      {c.header}
                    </dt>
                  )}
                  <dd className="min-w-0">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}
