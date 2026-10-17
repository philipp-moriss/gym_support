import type { ProgramExerciseView, ProgramWeekPlan } from '../../shared';

export type Trend = 'up' | 'flat' | 'down';

export interface JournalAnalysis {
  summary: string;
  progress: { exerciseId: string; trend: Trend; note: string }[];
  concerns: string[];
}

/** Правка ИИ, проверенная по программе; `before` — для показа «было → стало». */
export interface SuggestedChange {
  exerciseId: string;
  exercise: string;
  before: {
    base: number | null;
    step: number;
    targetSets: number;
    repsMin: number;
    repsMax: number;
    weeks: ProgramWeekPlan[] | null;
    /** Что предложил бы скрипт (двойная прогрессия) на следующую тренировку. */
    formula: number | null;
  };
  base?: number;
  step?: number;
  targetSets?: number;
  repsMin?: number;
  repsMax?: number;
  weeks?: ProgramWeekPlan[];
  reason: string;
}

export interface ProgramReview {
  summary: string;
  changes: SuggestedChange[];
  ideas: string[];
  /** Сколько правок ИИ отброшено как неподходящие. */
  dropped: number;
}

export interface AnalysisResult {
  journal: JournalAnalysis;
  program: ProgramReview;
}

const str = (v: unknown, max = 2000) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const strings = (v: unknown, max = 20) =>
  Array.isArray(v)
    ? v
        .map((s) => str(s, 1000))
        .filter(Boolean)
        .slice(0, max)
    : [];

const num = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
    ? Math.round(v * 100) / 100
    : undefined;

const int = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
    ? v
    : undefined;

export class InvalidAgentAnswer extends Error {}

export function normalizeJournalAnalysis(
  raw: Record<string, unknown>,
): JournalAnalysis {
  const summary = str(raw.summary);
  if (!summary) throw new InvalidAgentAnswer('journal_analysis: empty summary');
  const progress = Array.isArray(raw.progress)
    ? raw.progress.flatMap((p: unknown) => {
        if (typeof p !== 'object' || p === null) return [];
        const { exerciseId, trend, note } = p as Record<string, unknown>;
        const id = str(exerciseId, 40);
        if (!id) return [];
        return [
          {
            exerciseId: id,
            trend: (['up', 'flat', 'down'] as const).includes(trend as Trend)
              ? (trend as Trend)
              : ('flat' as const),
            note: str(note, 500),
          },
        ];
      })
    : [];
  return { summary, progress, concerns: strings(raw.concerns) };
}

function weeksOf(v: unknown): ProgramWeekPlan[] | undefined {
  if (!Array.isArray(v) || v.length !== 4) return undefined;
  const weeks: ProgramWeekPlan[] = [];
  for (const w of v) {
    if (typeof w !== 'object' || w === null) return undefined;
    const r = w as Record<string, unknown>;
    const sets = int(r.sets, 1, 20);
    const reps = int(r.reps, 1, 1000);
    if (sets === undefined || reps === undefined) return undefined;
    const repsMax = int(r.repsMax, reps, 1000);
    const weight = num(r.weight, 0, 1000);
    const label = str(r.label, 60);
    weeks.push({
      sets,
      reps,
      ...(repsMax !== undefined && repsMax > reps && { repsMax }),
      ...(weight !== undefined && { weight }),
      ...(label && { label }),
    });
  }
  return weeks;
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Правки ИИ проверяются по программе: неизвестное упражнение, base у
 * упражнения на плане по неделям, кривые числа, правки «ни о чём» — отбрасываются.
 */
export function normalizeProgramReview(
  raw: Record<string, unknown>,
  exercises: ProgramExerciseView[],
  /** Вес по формулам на следующую тренировку, по id упражнения. */
  formula: Map<string, number> = new Map(),
): ProgramReview {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const seen = new Set<string>();
  let dropped = 0;
  const changes: SuggestedChange[] = [];
  for (const c of Array.isArray(raw.changes) ? raw.changes : []) {
    const r = (typeof c === 'object' && c !== null ? c : {}) as Record<
      string,
      unknown
    >;
    const ex = byId.get(str(r.exerciseId, 40));
    const reason = str(r.reason, 500);
    if (!ex || !reason || seen.has(ex.id)) {
      dropped++;
      continue;
    }
    const base = ex.base !== null ? num(r.base, 0, 1000) : undefined;
    const step = num(r.step, 0, 50);
    const weeks = ex.weeks !== null ? weeksOf(r.weeks) : undefined;
    const withBase = ex.base !== null;
    const targetSets = withBase ? int(r.targetSets, 1, 10) : undefined;
    const repsMin = withBase ? int(r.repsMin, 1, 100) : undefined;
    const repsMax = withBase ? int(r.repsMax, 1, 100) : undefined;
    const current = formula.get(ex.id) ?? ex.base;
    const change: SuggestedChange = {
      exerciseId: ex.id,
      exercise: ex.name,
      before: {
        base: ex.base,
        step: ex.step,
        targetSets: ex.targetSets,
        repsMin: ex.repsMin,
        repsMax: ex.repsMax,
        weeks: ex.weeks,
        formula: withBase ? (formula.get(ex.id) ?? null) : null,
      },
      // Рабочий вес, совпадающий с расчётом формул, — не правка.
      ...(base !== undefined && base !== current && { base }),
      ...(step !== undefined && step !== ex.step && { step }),
      ...(targetSets !== undefined &&
        targetSets !== ex.targetSets && { targetSets }),
      ...(repsMin !== undefined && repsMin !== ex.repsMin && { repsMin }),
      ...(repsMax !== undefined && repsMax !== ex.repsMax && { repsMax }),
      ...(weeks && !same(weeks, ex.weeks) && { weeks }),
      reason,
    };
    if ((change.repsMin ?? ex.repsMin) > (change.repsMax ?? ex.repsMax)) {
      dropped++;
      continue;
    }
    if (
      change.base === undefined &&
      change.step === undefined &&
      change.targetSets === undefined &&
      change.repsMin === undefined &&
      change.repsMax === undefined &&
      change.weeks === undefined
    ) {
      dropped++;
      continue;
    }
    seen.add(ex.id);
    changes.push(change);
  }
  return {
    summary: str(raw.summary) || 'ИИ не написал итог.',
    changes,
    ideas: strings(raw.ideas),
    dropped,
  };
}
