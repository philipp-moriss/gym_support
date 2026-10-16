import type { Borders, Fill, Font, Worksheet } from 'exceljs'
import { sortEntries, volume, type Entry } from '@/entities/entry'
import {
  WEEK_PERCENT,
  hasBase,
  planFor,
  type Exercise,
} from '@/entities/program'
import { downloadBlob, num } from '@/shared/lib'
import { xlsxPalette as c } from './palette'

/*
 * Выгрузка в стиле «Flying Papers»: фиолетовая шапка с жёлтым плакатным
 * заголовком, чернильная строка колонок с моно-метками, кремовые строки
 * с полосами, жёлтая строка «Итого». Без теней и лишних рамок.
 */

const fill = (argb: string): Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
})
const thin = { style: 'thin' as const, color: { argb: c.border } }
const rowBorder: Partial<Borders> = { bottom: thin }

const fonts = {
  display: {
    name: 'Rubik',
    size: 22,
    bold: true,
    color: { argb: c.hiVisYellow },
  },
  stamp: { name: 'JetBrains Mono', size: 9, color: { argb: c.boneWhite } },
  header: {
    name: 'JetBrains Mono',
    size: 9,
    bold: true,
    color: { argb: c.boneWhite },
  },
  body: { name: 'Rubik', size: 11, color: { argb: c.inkBlack } },
  total: { name: 'Rubik', size: 11, bold: true, color: { argb: c.inkBlack } },
} satisfies Record<string, Partial<Font>>

type Column = { header: string; width: number; numFmt?: string }

/** Шапка листа: заголовок, штамп и строка колонок. Возвращает номер первой строки данных. */
function paintHead(
  ws: Worksheet,
  title: string,
  stamp: string,
  columns: Column[],
) {
  const last = columns.length
  ws.columns = columns.map((col) => ({
    width: col.width,
    style: { numFmt: col.numFmt },
  }))

  ws.mergeCells(1, 1, 1, last)
  const titleRow = ws.getRow(1)
  titleRow.height = 42
  titleRow.getCell(1).value = title.toUpperCase()
  titleRow.getCell(1).font = fonts.display
  titleRow.getCell(1).alignment = { vertical: 'middle', indent: 1 }

  ws.mergeCells(2, 1, 2, last)
  const stampRow = ws.getRow(2)
  stampRow.height = 22
  stampRow.getCell(1).value = stamp.toUpperCase()
  stampRow.getCell(1).font = fonts.stamp
  stampRow.getCell(1).alignment = { vertical: 'top', indent: 1 }

  // Фиолетовая сцена под заголовком
  for (const r of [1, 2]) {
    for (let col = 1; col <= last; col++)
      ws.getCell(r, col).fill = fill(c.duskViolet)
  }

  ws.getRow(3).height = 6
  for (let col = 1; col <= last; col++)
    ws.getCell(3, col).fill = fill(c.duskViolet)

  const head = ws.getRow(4)
  head.height = 26
  columns.forEach((col, i) => {
    const cell = head.getCell(i + 1)
    cell.value = col.header.toUpperCase()
    cell.font = fonts.header
    cell.fill = fill(c.inkBlack)
    cell.alignment = {
      vertical: 'middle',
      horizontal: col.numFmt ? 'right' : 'left',
      indent: 1,
    }
  })

  ws.views = [{ state: 'frozen', ySplit: 4, showGridLines: false }]
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: last } }
  return 5
}

function paintBodyRow(
  ws: Worksheet,
  rowNumber: number,
  columns: Column[],
  striped: boolean,
) {
  const row = ws.getRow(rowNumber)
  row.height = 22
  columns.forEach((col, i) => {
    const cell = row.getCell(i + 1)
    cell.font = fonts.body
    cell.fill = fill(striped ? c.muted : c.boneWhite)
    cell.border = rowBorder
    cell.alignment = {
      vertical: 'middle',
      horizontal: col.numFmt ? 'right' : 'left',
      indent: 1,
      wrapText: !col.numFmt,
    }
  })
}

function paintTotalRow(ws: Worksheet, rowNumber: number, columns: Column[]) {
  const row = ws.getRow(rowNumber)
  row.height = 26
  columns.forEach((col, i) => {
    const cell = row.getCell(i + 1)
    cell.font = fonts.total
    cell.fill = fill(c.hiVisYellow)
    cell.alignment = {
      vertical: 'middle',
      horizontal: col.numFmt ? 'right' : 'left',
      indent: 1,
    }
  })
}

const toExcelDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export async function buildWorkbook(entries: Entry[], exercises: Exercise[]) {
  const exerciseById = new Map(exercises.map((e) => [e.id, e]))
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Журнал тренировок'
  wb.created = new Date()
  wb.calcProperties.fullCalcOnLoad = true

  const sorted = sortEntries(entries)
  const today = new Date().toLocaleDateString('ru-RU')
  const totalVolume = sorted.reduce((s, e) => s + volume(e), 0)

  // Лист 1: дневник — те же колонки, что в «План тренировок.xlsx», плюс самочувствие и объём
  const journalCols: Column[] = [
    { header: 'Дата', width: 13, numFmt: 'dd.mm.yyyy' },
    { header: 'Неделя', width: 9, numFmt: '0' },
    { header: 'Упражнение', width: 32 },
    { header: 'Вес, кг', width: 10, numFmt: '0.0' },
    { header: 'Подходы', width: 10, numFmt: '0' },
    { header: 'Повторы', width: 10, numFmt: '0' },
    { header: 'Боль в спине', width: 13, numFmt: '0' },
    { header: 'Сложность (0–10)', width: 16, numFmt: '0' },
    { header: 'Объём, кг', width: 12, numFmt: '#,##0' },
    { header: 'Заметки', width: 40 },
  ]
  const journal = wb.addWorksheet('Дневник', {
    properties: { tabColor: { argb: c.duskViolet } },
  })
  let r = paintHead(
    journal,
    'Дневник тренировок',
    `Выгружено ${today} · записей: ${sorted.length} · боль 4 и выше — снижаем нагрузку`,
    journalCols,
  )
  const first = r
  sorted.forEach((e, i) => {
    const ex = e.exerciseId ? exerciseById.get(e.exerciseId) : undefined
    const unit =
      ex && ex.unit !== 'reps' ? ` (${ex.unit === 'sec' ? 'сек' : 'мин'})` : ''
    journal.getRow(r).values = [
      toExcelDate(e.date),
      e.week ?? '',
      e.exercise + unit,
      e.weight,
      e.sets,
      e.reps,
      e.pain ?? '',
      e.effort ?? '',
      // По подходам повторы разные — объём числом, а не формулой.
      e.setReps?.length
        ? volume(e)
        : { formula: `D${r}*E${r}*F${r}`, result: volume(e) },
      e.setReps?.length
        ? [`Подходы: ${e.setReps.join(' · ')}`, e.notes]
            .filter(Boolean)
            .join('. ')
        : e.notes,
    ]
    paintBodyRow(journal, r, journalCols, i % 2 === 1)
    // Боль 4+ подсвечиваем розовым, как сигнал снизить нагрузку
    if ((e.pain ?? 0) >= 4) journal.getCell(r, 7).fill = fill(c.bubblegumPink)
    r++
  })
  const lastData = r - 1
  const sum = (col: string, result: number) =>
    sorted.length
      ? { formula: `SUM(${col}${first}:${col}${lastData})`, result }
      : 0
  journal.getRow(r).values = [
    'Итого',
    '',
    `Тренировок: ${new Set(sorted.map((e) => e.date)).size}`,
    '',
    sum(
      'E',
      sorted.reduce((s, e) => s + e.sets, 0),
    ),
    '',
    '',
    '',
    sum('I', totalVolume),
    '',
  ]
  paintTotalRow(journal, r, journalCols)

  // Лист 2: рабочие веса на 4 недели, как в исходном плане
  const planCols: Column[] = [
    { header: 'Упражнение', width: 34 },
    { header: 'Последний вес', width: 15, numFmt: '0.0' },
    ...WEEK_PERCENT.map((p, i) => ({
      header: `Нед. ${i + 1} · ${Math.round(p * 100)}%`,
      width: 16,
    })),
  ]
  const plan = wb.addWorksheet('Веса на 4 недели', {
    properties: { tabColor: { argb: c.hiVisYellow } },
  })
  r = paintHead(
    plan,
    'Рабочие веса',
    `Округление до 2,5 кг · ${today}`,
    planCols,
  )
  exercises
    .filter((ex) => ex.group === 'main')
    .forEach((ex, i) => {
      const weeks = [1, 2, 3, 4].map((w) => {
        const p = planFor(ex, w)
        const weight = hasBase(ex)
          ? `${num(p.weight ?? 0)} кг`
          : (p.label ?? (p.weight ? `${num(p.weight)} кг` : ''))
        return `${weight}: ${p.sets} × ${p.repsMax ? `${p.reps}–${p.repsMax}` : p.reps}`
      })
      plan.getRow(r).values = [ex.name, ex.base ?? '', ...weeks]
      paintBodyRow(plan, r, planCols, i % 2 === 1)
      r++
    })

  // Лист 3: сводка по упражнениям
  const byExercise = new Map<
    string,
    { days: Set<string>; sets: number; maxWeight: number; volume: number }
  >()
  for (const e of sorted) {
    const s = byExercise.get(e.exercise) ?? {
      days: new Set(),
      sets: 0,
      maxWeight: 0,
      volume: 0,
    }
    s.days.add(e.date)
    s.sets += e.sets
    s.maxWeight = Math.max(s.maxWeight, e.weight)
    s.volume += volume(e)
    byExercise.set(e.exercise, s)
  }
  const summaryCols: Column[] = [
    { header: 'Упражнение', width: 32 },
    { header: 'Тренировок', width: 13, numFmt: '0' },
    { header: 'Подходов', width: 12, numFmt: '0' },
    { header: 'Макс. вес, кг', width: 15, numFmt: '0.0' },
    { header: 'Объём, кг', width: 14, numFmt: '#,##0' },
  ]
  const summary = wb.addWorksheet('Сводка', {
    properties: { tabColor: { argb: c.matchaCream } },
  })
  r = paintHead(summary, 'Сводка', `По упражнениям · ${today}`, summaryCols)
  ;[...byExercise.entries()]
    .sort((a, b) => b[1].volume - a[1].volume)
    .forEach(([name, s], i) => {
      summary.getRow(r).values = [
        name,
        s.days.size,
        s.sets,
        s.maxWeight,
        s.volume,
      ]
      paintBodyRow(summary, r, summaryCols, i % 2 === 1)
      r++
    })
  summary.getRow(r).values = ['Итого', '', '', '', totalVolume]
  paintTotalRow(summary, r, summaryCols)

  return wb
}

export async function downloadXlsx(entries: Entry[], exercises: Exercise[]) {
  const wb = await buildWorkbook(entries, exercises)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, `trenirovki-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
