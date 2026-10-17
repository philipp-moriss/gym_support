import type {
  JournalEntryView,
  ProgramView,
  ProgramWeekPlan,
} from '../../shared';
import type { JournalAnalysis } from './analysis-result';

/** Сколько недель дневника отдаём ИИ. */
export const HISTORY_WEEKS = 12;

const DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

/** Неделя цикла: с понедельника `startDate`, 1-я — первая. */
export function cycleWeek(startDate: string, today: string) {
  const ms =
    Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`);
  return Math.max(1, Math.floor(ms / (7 * 86_400_000)) + 1);
}

const weeksText = (weeks: ProgramWeekPlan[] | null) =>
  weeks
    ?.map(
      (w, i) =>
        `н${i + 1} ${w.sets}×${w.reps}${w.repsMax ? `–${w.repsMax}` : ''}${
          w.weight ? ` @${w.weight}кг` : ''
        }`,
    )
    .join(', ') ?? '';

const notesBlock = (notes: string) =>
  `Заметки тренера о клиенте:\n${notes.trim() || '(нет)'}`;

/** Дневник строками: дата | неделя | упражнение (id) | подходы×повторы | вес | боль | сложность | заметка. */
export function journalLines(entries: JournalEntryView[]) {
  if (!entries.length) return '(записей нет)';
  return entries
    .map((e) =>
      [
        e.date,
        `нед ${e.week ?? '?'}`,
        `${e.exercise} (${e.exerciseId ?? '—'})`,
        `${e.sets}×${e.reps}${e.setReps?.length ? ` [${e.setReps.join(',')}]` : ''}`,
        e.weight ? `${e.weight} кг` : 'без веса',
        `боль ${e.pain ?? '—'}`,
        `сложность ${e.effort ?? '—'}`,
        e.notes.trim().replace(/\s+/g, ' ').slice(0, 200),
      ]
        .filter(Boolean)
        .join(' | '),
    )
    .join('\n');
}

export function programLines({ exercises, settings }: ProgramView) {
  const list = exercises.map((e) =>
    [
      `- ${e.id}: ${e.name}`,
      `мышцы ${e.muscle}`,
      e.group === 'main' ? 'основное' : 'доп.',
      `единица ${e.unit}${e.perSide ? ' (на сторону)' : ''}`,
      e.base !== null ? `base ${e.base} кг` : `weeks ${weeksText(e.weeks)}`,
      `step ${e.step}`,
      e.days.length ? `дни ${e.days.map((d) => DAYS[d]).join(',')}` : null,
      e.alternativeOf ? `замена для ${e.alternativeOf}` : null,
    ]
      .filter(Boolean)
      .join('; '),
  );
  const schedule = settings.schedule
    .map(
      (d, i) =>
        `${DAYS[i]}: ${d.gym === 'yes' ? 'зал' : d.gym === 'optional' ? 'по желанию' : 'отдых'}${d.title ? ` (${d.title})` : ''}`,
    )
    .join(', ');
  return [
    'Упражнения:',
    ...list,
    `Расписание: ${schedule}`,
    `Правила: ${settings.rules.join(' / ') || '(нет)'}`,
  ].join('\n');
}

export function journalAnalysisData(input: {
  notes: string;
  today: string;
  week: number;
  entries: JournalEntryView[];
}) {
  return [
    notesBlock(input.notes),
    '',
    `Сегодня: ${input.today}, неделя цикла ${input.week}.`,
    '',
    `Дневник за ${HISTORY_WEEKS} недель (дата | неделя | упражнение (id) | подходы×повторы [по подходам] | вес | боль | сложность | заметка):`,
    journalLines(input.entries),
  ].join('\n');
}

export function programReviewData(input: {
  notes: string;
  today: string;
  week: number;
  program: ProgramView;
  journal: JournalAnalysis;
}) {
  return [
    notesBlock(input.notes),
    '',
    `Сегодня: ${input.today}, неделя цикла ${input.week}.`,
    '',
    'Анализ дневника (JSON):',
    JSON.stringify(input.journal),
    '',
    'Программа:',
    programLines(input.program),
  ].join('\n');
}
