import { FileSpreadsheet, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import type { EntryInput } from '@/entities/entry'
import type { Exercise } from '@/entities/program'
import { formatDay, plural } from '@/shared/lib'
import { Button, type ButtonProps } from '@/shared/ui'
import {
  ImportError,
  matchExercises,
  parseJournal,
  readWorkbook,
} from '../model/parse-journal'
import { useImportEntries } from '../model/use-import-entries'

type Preview = {
  file: string
  entries: EntryInput[]
  unmatched: string[]
  from: string
  to: string
}

/**
 * Загрузка .xlsx с прошлыми тренировками: файл разбирается в браузере,
 * показываем, что нашли, и только потом отправляем. Повторы пропускаются.
 */
export function ImportXlsx({
  exercises,
  buttonVariant = 'highlight',
  onDone,
}: {
  exercises: Exercise[]
  buttonVariant?: ButtonProps['variant']
  onDone?: (added: number) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const importEntries = useImportEntries()

  async function onFile(file: File) {
    setError(null)
    setResult(null)
    setReading(true)
    try {
      const rows = parseJournal(await readWorkbook(file))
      if (!rows.length)
        throw new ImportError(
          'В файле нет записей: строки без даты или упражнения пропускаются.',
        )
      const { entries, unmatched } = matchExercises(rows, exercises)
      const dates = entries.map((e) => e.date).sort()
      setPreview({
        file: file.name,
        entries,
        unmatched,
        from: dates[0],
        to: dates[dates.length - 1],
      })
    } catch (e) {
      setError(
        e instanceof ImportError ? e.message : 'Не получилось прочитать файл.',
      )
    } finally {
      setReading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={input}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        data-testid="xlsx-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void onFile(file)
        }}
      />
      {!preview && (
        <Button
          variant={buttonVariant}
          onClick={() => input.current?.click()}
          disabled={reading}
          className="self-start"
        >
          <Upload />
          {reading ? 'Читаю файл…' : 'Загрузить Excel'}
        </Button>
      )}

      {preview && (
        <div className="rise flex flex-col gap-3 rounded-md bg-card p-4 text-card-foreground">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="mt-0.5 size-6 shrink-0" />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-bold">{preview.file}</span>
              <span className="text-[15px]">
                <b>
                  {preview.entries.length}{' '}
                  {plural(preview.entries.length, [
                    'запись',
                    'записи',
                    'записей',
                  ])}
                </b>{' '}
                · {formatDay(preview.from, { weekday: undefined })}
                {preview.from !== preview.to &&
                  ` — ${formatDay(preview.to, { weekday: undefined })}`}
              </span>
            </div>
          </div>
          {preview.unmatched.length > 0 && (
            <p className="rounded-md bg-buttery-yellow/60 p-3 text-sm">
              Нет в программе: {preview.unmatched.join(', ')}. Эти записи
              попадут в дневник и награды, но не в подстройку весов.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ink"
              disabled={importEntries.isPending}
              onClick={() =>
                importEntries.mutate(preview.entries, {
                  onSuccess: ({ added, skipped }) => {
                    setPreview(null)
                    setResult(
                      `Добавлено ${added} ${plural(added, ['запись', 'записи', 'записей'])}` +
                        (skipped
                          ? `, ${skipped} уже ${plural(skipped, ['была', 'были', 'были'])} в дневнике`
                          : '') +
                        '.',
                    )
                    onDone?.(added)
                  },
                  onError: () =>
                    setError('Сервер не принял файл. Попробуй ещё раз.'),
                })
              }
            >
              <Upload />
              {importEntries.isPending ? 'Загружаю…' : 'Загрузить в дневник'}
            </Button>
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md bg-bubblegum-pink px-3 py-2 text-sm font-semibold text-ink"
        >
          {error}
        </p>
      )}
      {result && (
        <p className="pop-in rounded-md bg-matcha-cream px-3 py-2 text-sm font-semibold text-ink">
          {result}
        </p>
      )}
    </div>
  )
}
