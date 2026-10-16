import type { CellValue, Workbook, Worksheet } from 'exceljs'
import { legacyEffort, type EntryInput } from '@/entities/entry'
import type { Exercise, Unit } from '@/entities/program'

/** Строка дневника из файла, ещё без привязки к программе. */
export type ParsedRow = Omit<EntryInput, 'exerciseId'> & {
  /** Из подписи «Планка (сек)»; нужна, если упражнение добавят в программу. */
  unit: Unit
}

export class ImportError extends Error {}

type Column =
  | 'date'
  | 'week'
  | 'exercise'
  | 'weight'
  | 'sets'
  | 'reps'
  | 'pain'
  | 'effort'
  | 'feel'
  | 'notes'

/**
 * Колонки ищем по началу заголовка, без регистра. Поддерживаются наша
 * выгрузка («Сложность (0–10)», в старых файлах «Как пошло») и лист
 * «Дневник» из «План тренировок.xlsx» («Боль в спине (0–10)», без сложности).
 */
const HEADERS: [Column, RegExp][] = [
  ['date', /^дата/],
  ['week', /^недел/],
  ['exercise', /^упражнен/],
  ['weight', /^вес/],
  ['sets', /^подход/],
  ['reps', /^(повтор|время)/],
  ['pain', /^боль/],
  ['effort', /^сложност/],
  ['feel', /^как пошл/],
  ['notes', /^(заметк|комментар)/],
]

const feelWords: Record<string, number> = {
  легко: legacyEffort.easy,
  норм: legacyEffort.ok,
  нормально: legacyEffort.ok,
  тяжело: legacyEffort.hard,
}

/** Значение ячейки без формул, rich text и ссылок. */
function plain(v: CellValue): string | number | Date | null {
  if (v === null || v === undefined) return null
  if (v instanceof Date || typeof v === 'number' || typeof v === 'string')
    return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'object') {
    if ('result' in v) return plain(v.result as CellValue)
    if ('richText' in v) return v.richText.map((t) => t.text).join('')
    if ('text' in v) return String(v.text)
  }
  return null
}

const text = (v: CellValue) => {
  const p = plain(v)
  return p === null
    ? ''
    : p instanceof Date
      ? p.toISOString()
      : String(p).trim()
}

function number(v: CellValue): number | null {
  const p = plain(v)
  if (typeof p === 'number') return Number.isFinite(p) ? p : null
  if (typeof p === 'string') {
    const n = Number(p.replace(',', '.').replace(/[^\d.-]/g, ''))
    return p.trim() && Number.isFinite(n) ? n : null
  }
  return null
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Дата из ячейки: Date (exceljs отдаёт полночь UTC), серийный номер Excel, «12.10.2026», «2026-10-12». */
export function parseDate(v: CellValue): string | null {
  const p = plain(v)
  if (p instanceof Date)
    return `${p.getUTCFullYear()}-${pad(p.getUTCMonth() + 1)}-${pad(p.getUTCDate())}`
  if (typeof p === 'number' && p > 20_000 && p < 80_000) {
    const d = new Date(Math.round((p - 25_569) * 86_400_000))
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  }
  if (typeof p === 'string') {
    const ru = p.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})$/)
    if (ru) {
      const year = ru[3].length === 2 ? 2000 + Number(ru[3]) : Number(ru[3])
      return `${year}-${pad(Number(ru[2]))}-${pad(Number(ru[1]))}`
    }
    const iso = p.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  }
  return null
}

const clamp10 = (n: number | null) =>
  n === null ? null : Math.round(Math.min(10, Math.max(0, n)))

function findHeader(ws: Worksheet) {
  for (let r = 1; r <= Math.min(ws.rowCount, 15); r++) {
    const cols = new Map<Column, number>()
    ws.getRow(r).eachCell((cell, col) => {
      const h = text(cell.value).toLowerCase().replace(/ё/g, 'е')
      const hit = HEADERS.find(([key, re]) => !cols.has(key) && re.test(h))
      if (hit) cols.set(hit[0], col)
    })
    if (cols.has('date') && cols.has('exercise')) return { row: r, cols }
  }
  return null
}

/** Лист «Дневник» → строки дневника. Итоги, пустые и строки без даты пропускаются. */
export function parseJournal(wb: Workbook): ParsedRow[] {
  const sheets = [
    ...wb.worksheets.filter((w) => w.name.trim().toLowerCase() === 'дневник'),
    ...wb.worksheets.filter((w) => w.name.trim().toLowerCase() !== 'дневник'),
  ]
  for (const ws of sheets) {
    const header = findHeader(ws)
    if (!header) continue
    const { row: headerRow, cols } = header
    const get = (r: number, key: Column) =>
      cols.has(key) ? ws.getRow(r).getCell(cols.get(key)!).value : null

    // В «План тренировок.xlsx» первая строка дневника — пример заполнения.
    let skipExample = false
    for (let r = 1; r < headerRow; r++) {
      ws.getRow(r).eachCell((cell) => {
        if (/первая строка\s*[—-]\s*пример/i.test(text(cell.value)))
          skipExample = true
      })
    }

    const rows: ParsedRow[] = []
    for (let r = headerRow + 1; r <= ws.rowCount; r++) {
      const date = parseDate(get(r, 'date'))
      const rawName = text(get(r, 'exercise'))
      const suffix = rawName.match(/\s*\((сек|мин)\)\s*$/i)
      const exercise = suffix ? rawName.slice(0, suffix.index) : rawName
      if (!date || !exercise) continue
      if (skipExample) {
        skipExample = false
        continue
      }
      const feel = feelWords[text(get(r, 'feel')).toLowerCase()]
      const week = number(get(r, 'week'))
      rows.push({
        date,
        week: week && week > 0 ? Math.round(week) : null,
        exercise: exercise.slice(0, 160),
        weight: Math.max(0, number(get(r, 'weight')) ?? 0),
        sets: Math.max(0, Math.round(number(get(r, 'sets')) ?? 0)),
        reps: Math.max(0, Math.round(number(get(r, 'reps')) ?? 0)),
        pain: clamp10(number(get(r, 'pain'))),
        effort: clamp10(number(get(r, 'effort'))) ?? feel ?? null,
        notes: text(get(r, 'notes')).slice(0, 2000),
        unit: suffix
          ? suffix[1].toLowerCase() === 'сек'
            ? 'sec'
            : 'min'
          : 'reps',
      })
    }
    return rows
  }
  throw new ImportError('Не нашли лист с колонками «Дата» и «Упражнение».')
}

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"'()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Упражнения сопоставляются с программой по полному или короткому названию. */
export function matchExercises(rows: ParsedRow[], exercises: Exercise[]) {
  const byName = new Map<string, Exercise>()
  for (const ex of exercises) {
    byName.set(normalize(ex.short), ex)
    byName.set(normalize(ex.name), ex)
  }
  const unmatched = new Set<string>()
  const entries: EntryInput[] = rows.map(({ unit: _unit, ...row }) => {
    const ex = byName.get(normalize(row.exercise))
    if (!ex) unmatched.add(row.exercise)
    return {
      ...row,
      exercise: ex?.name ?? row.exercise,
      exerciseId: ex?.id ?? null,
    }
  })
  return { entries, unmatched: [...unmatched] }
}

export async function readWorkbook(file: File) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(await file.arrayBuffer())
  } catch {
    throw new ImportError(
      'Не получилось открыть файл. Нужен .xlsx из Excel, Numbers или Google Таблиц.',
    )
  }
  return wb
}
