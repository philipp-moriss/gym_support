import type { ProgramExerciseView } from '../../shared';
import {
  InvalidAgentAnswer,
  normalizeJournalAnalysis,
  normalizeProgramReview,
} from '../services/analysis-result';

const exercise = (
  patch: Partial<ProgramExerciseView>,
): ProgramExerciseView => ({
  id: 'bench',
  position: 0,
  name: 'Жим лёжа',
  short: 'Жим',
  muscle: 'chest',
  group: 'main',
  unit: 'reps',
  perSide: false,
  base: 40,
  baseSetAt: null,
  step: 2.5,
  targetSets: 3,
  repsMin: 12,
  repsMax: 15,
  weeks: null,
  alternativeOf: null,
  tips: [],
  days: [],
  ...patch,
});

const plank = exercise({
  id: 'plank',
  name: 'Планка',
  base: null,
  step: 0,
  unit: 'sec',
  weeks: [1, 2, 3, 4].map(() => ({ sets: 3, reps: 30 })),
});

describe('normalizeJournalAnalysis', () => {
  it('requires a summary', () => {
    expect(() => normalizeJournalAnalysis({})).toThrow(InvalidAgentAnswer);
  });

  it('keeps known trends, defaults unknown to flat, drops items without id', () => {
    const result = normalizeJournalAnalysis({
      summary: ' Хорошо ',
      progress: [
        { exerciseId: 'bench', trend: 'up', note: '+5 кг' },
        { exerciseId: 'row', trend: 'sideways' },
        { trend: 'up' },
      ],
      concerns: ['боль', 3, ''],
    });
    expect(result).toEqual({
      summary: 'Хорошо',
      progress: [
        { exerciseId: 'bench', trend: 'up', note: '+5 кг' },
        { exerciseId: 'row', trend: 'flat', note: '' },
      ],
      concerns: ['боль'],
    });
  });
});

describe('normalizeProgramReview', () => {
  const program = [exercise({}), plank];

  it('keeps valid changes with the current values as `before`', () => {
    const review = normalizeProgramReview(
      {
        summary: 'Чуть больше',
        changes: [{ exerciseId: 'bench', base: 42.5, reason: 'легко' }],
        ideas: ['Добавить растяжку'],
      },
      program,
    );
    expect(review.changes).toEqual([
      {
        exerciseId: 'bench',
        exercise: 'Жим лёжа',
        before: {
          base: 40,
          step: 2.5,
          targetSets: 3,
          repsMin: 12,
          repsMax: 15,
          weeks: null,
          formula: null,
        },
        base: 42.5,
        reason: 'легко',
      },
    ]);
    expect(review.ideas).toEqual(['Добавить растяжку']);
    expect(review.dropped).toBe(0);
  });

  it('drops unknown exercises, base on a weekly plan, broken weeks, no-ops and duplicates', () => {
    const review = normalizeProgramReview(
      {
        summary: 's',
        changes: [
          { exerciseId: 'ghost', base: 10, reason: 'r' },
          { exerciseId: 'plank', base: 10, reason: 'r' },
          { exerciseId: 'plank', weeks: [{ sets: 3, reps: 30 }], reason: 'r' },
          { exerciseId: 'bench', base: 40, reason: 'то же самое' },
          { exerciseId: 'bench', base: 45 },
          { exerciseId: 'bench', base: 45, reason: 'r' },
          { exerciseId: 'bench', base: 47.5, reason: 'второй раз' },
        ],
      },
      program,
    );
    expect(review.changes.map((c) => [c.exerciseId, c.base])).toEqual([
      ['bench', 45],
    ]);
    expect(review.dropped).toBe(6);
  });

  it('compares the weight with the formula result and accepts rep-range changes', () => {
    const review = normalizeProgramReview(
      {
        summary: 's',
        changes: [
          { exerciseId: 'bench', base: 42.5, reason: 'как формула' },
          { exerciseId: 'plank', repsMin: 8, reason: 'нет базы' },
        ],
      },
      [exercise({ id: 'bench' }), exercise({ id: 'row', name: 'Тяга' })],
      new Map([['bench', 42.5]]),
    );
    expect(review.changes).toEqual([]);
    const scheme = normalizeProgramReview(
      {
        summary: 's',
        changes: [
          { exerciseId: 'bench', repsMin: 8, repsMax: 10, reason: 'сила' },
          { exerciseId: 'row', repsMin: 14, repsMax: 10, reason: 'кривой' },
        ],
      },
      [exercise({}), exercise({ id: 'row', name: 'Тяга' })],
    );
    expect(scheme.changes).toMatchObject([
      { exerciseId: 'bench', repsMin: 8, repsMax: 10 },
    ]);
    expect(scheme.dropped).toBe(1);
  });

  it('accepts a full 4-week plan for a plan exercise', () => {
    const weeks = [30, 35, 40, 45].map((reps) => ({ sets: 3, reps }));
    const review = normalizeProgramReview(
      { summary: 's', changes: [{ exerciseId: 'plank', weeks, reason: 'r' }] },
      program,
    );
    expect(review.changes[0].weeks).toEqual(weeks);
  });
});
