import { FileSpreadsheet, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import type { EntryInput } from '@/entities/entry'
import {
  muscles,
  setsReps,
  type Exercise,
  type ExerciseInput,
} from '@/entities/program'
import { formatDay, num, plural } from '@/shared/lib'
import { Button, type ButtonProps } from '@/shared/ui'
import {
  ImportError,
  matchExercises,
  parseJournal,
  readWorkbook,
} from '../model/parse-journal'
import { exerciseFromRows } from '../model/new-exercises'
import { useImportEntries } from '../model/use-import-entries'

type Preview = {
  file: string
  entries: EntryInput[]
  /** Нет в программе: черновики, которые можно добавить. */
  unmatched: { source: string; input: ExerciseInput }[]
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
  /** Какие ненайденные упражнения добавить в программу (по названию в файле). */
  const [skipNew, setSkipNew] = useState<Set<string>>(new Set())
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
      setSkipNew(new Set())
      setPreview({
        file: file.name,
        entries,
        unmatched: unmatched.map((source) => ({
          source,
          input: exerciseFromRows(
            source,
            rows.filter((r) => r.exercise === source),
          ),
        })),
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
            <div className="flex flex-col gap-2 rounded-md bg-buttery-yellow/60 p-3">
              <p className="text-sm">
                <b>Нет в программе.</b> Отмеченные добавим как новые упражнения
                — записи сразу к ним привяжутся и попадут в подстройку весов.
                Мышцы, подходы и дни потом поправишь в «Плане».
              </p>
              <ul className="flex flex-col gap-1.5">
                {preview.unmatched.map(({ source, input }) => (
                  <li key={source}>
                    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 accent-[var(--ink-black)]"
                        checked={!skipNew.has(source)}
                        onChange={(e) => {
                          const next = new Set(skipNew)
                          if (e.target.checked) next.delete(source)
                          else next.add(source)
                          setSkipNew(next)
                        }}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="font-semibold">{source}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {muscles[input.muscle].label} ·{' '}
                          {input.base !== null
                            ? `рабочий вес ${num(input.base)} кг`
                            : setsReps(
                                input,
                                input.weeks![0].sets,
                                input.weeks![0].reps,
                              )}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ink"
              disabled={importEntries.isPending}
              onClick={() =>
                importEntries.mutate(
                  {
                    entries: preview.entries,
                    newExercises: preview.unmatched.filter(
                      (u) => !skipNew.has(u.source),
                    ),
                  },
                  {
                    onSuccess: ({ added, skipped }) => {
                      setPreview(null)
                      const created =
                        preview.unmatched.length -
                        [...skipNew].filter((n) =>
                          preview.unmatched.some((u) => u.source === n),
                        ).length
                      setResult(
                        `Добавлено ${added} ${plural(added, ['запись', 'записи', 'записей'])}` +
                          (created
                            ? `, в программе ${created} ${plural(created, ['новое упражнение', 'новых упражнения', 'новых упражнений'])}`
                            : '') +
                          (skipped
                            ? `, ${skipped} уже ${plural(skipped, ['была', 'были', 'были'])} в дневнике`
                            : '') +
                          '.',
                      )
                      onDone?.(added)
                    },
                    onError: () =>
                      setError('Сервер не принял файл. Попробуй ещё раз.'),
                  },
                )
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
