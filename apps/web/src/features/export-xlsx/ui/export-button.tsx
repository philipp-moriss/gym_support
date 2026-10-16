import { Download } from 'lucide-react'
import { useState } from 'react'
import type { Entry } from '@/entities/entry'
import type { Exercise } from '@/entities/program'
import { Button, type ButtonProps } from '@/shared/ui'
import { downloadXlsx } from '../model/build-workbook'

/** Выгрузка дневника в .xlsx в стиле «Flying Papers». */
export function ExportButton({
  entries,
  exercises,
  label = 'Выгрузить в Excel',
  ...props
}: { entries: Entry[]; exercises: Exercise[]; label?: string } & Omit<
  ButtonProps,
  'onClick'
>) {
  const [busy, setBusy] = useState(false)
  return (
    <Button
      {...props}
      disabled={!entries.length || busy || props.disabled}
      onClick={async () => {
        setBusy(true)
        try {
          await downloadXlsx(entries, exercises)
        } finally {
          setBusy(false)
        }
      }}
    >
      <Download />
      {busy ? 'Готовлю…' : label}
    </Button>
  )
}
