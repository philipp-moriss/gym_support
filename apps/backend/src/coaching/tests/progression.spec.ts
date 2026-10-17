import {
  e1rm,
  progress,
  type ProgressionEntry,
  type ProgressionExercise,
} from '../services/progression';

const bench: ProgressionExercise = {
  base: 40,
  baseSetAt: '2026-10-01T10:00:00Z',
  step: 2.5,
  muscle: 'chest',
  unit: 'reps',
  targetSets: 3,
  repsMin: 12,
  repsMax: 15,
};

const entry = (patch: Partial<ProgressionEntry>): ProgressionEntry => ({
  date: '2026-10-14',
  createdAt: '2026-10-14T18:00:00Z',
  sets: 3,
  reps: 12,
  setReps: null,
  weight: 40,
  pain: 0,
  effort: 6,
  ...patch,
});

const today = '2026-10-16';

describe('double progression', () => {
  it('starts from the working weight without history', () => {
    expect(progress(bench, [], today)).toMatchObject({
      weight: 40,
      sets: 3,
      reps: 12,
      kind: 'start',
    });
  });

  it('a working weight set after the last session wins over the session', () => {
    const coach = { ...bench, base: 45, baseSetAt: '2026-10-15T09:00:00Z' };
    expect(progress(coach, [entry({ weight: 40 })], today)).toMatchObject({
      weight: 45,
      kind: 'start',
    });
  });

  it('all sets at the top of the range with reps in reserve → +2.5% rounded up to the step', () => {
    const r = progress(
      bench,
      [entry({ setReps: [15, 15, 15], effort: 7 })],
      today,
    );
    expect(r).toMatchObject({ weight: 42.5, reps: 12, kind: 'up' });
  });

  it('lower body gets +5%, at least one step', () => {
    const squat = { ...bench, muscle: 'legs', base: 100 };
    expect(
      progress(squat, [entry({ weight: 100, setReps: [15, 15, 15] })], today)
        .weight,
    ).toBe(105);
    const light = { ...bench, base: 10 };
    expect(
      progress(light, [entry({ weight: 10, setReps: [15, 15, 15] })], today)
        .weight,
    ).toBe(12.5);
  });

  it('top of the range but at failure → no increase', () => {
    expect(
      progress(bench, [entry({ setReps: [15, 15, 15], effort: 9 })], today),
    ).toMatchObject({ weight: 40, kind: 'hold' });
  });

  it('below the top → same weight, one more rep than the worst set; two when easy', () => {
    expect(
      progress(bench, [entry({ setReps: [14, 13, 12] })], today),
    ).toMatchObject({ weight: 40, reps: 13, kind: 'reps' });
    expect(
      progress(bench, [entry({ setReps: [12, 12, 12], effort: 3 })], today)
        .reps,
    ).toBe(14);
  });

  it('pain 4+ → −10%, pain 7+ → −20% and one set less', () => {
    expect(progress(bench, [entry({ pain: 4 })], today)).toMatchObject({
      weight: 35,
      sets: 3,
      kind: 'down',
    });
    // 40 × 0.8 = 32 → вниз до шага 2.5.
    expect(progress(bench, [entry({ pain: 7 })], today)).toMatchObject({
      weight: 30,
      sets: 2,
      kind: 'down',
    });
  });

  it('two sessions at failure without progress → deload', () => {
    const r = progress(
      bench,
      [
        entry({ setReps: [12, 11, 10], effort: 10 }),
        entry({
          date: '2026-10-12',
          createdAt: '2026-10-12T18:00:00Z',
          setReps: [12, 11, 11],
          effort: 9,
        }),
      ],
      today,
    );
    expect(r).toMatchObject({ weight: 35, sets: 2, kind: 'deload' });
  });

  it('after a break: 2 weeks −10%, 4 weeks −20%', () => {
    expect(
      progress(bench, [entry({ date: '2026-10-01' })], today),
    ).toMatchObject({
      weight: 35,
      kind: 'return',
    });
    expect(
      progress(bench, [entry({ date: '2026-09-10', weight: 50 })], today)
        .weight,
    ).toBe(40);
  });
});

describe('e1RM (Epley with reps in reserve)', () => {
  it('counts reps left in reserve', () => {
    expect(e1rm(entry({ weight: 40, setReps: [12, 12, 12], effort: 8 }))).toBe(
      58.7,
    );
    expect(e1rm(entry({ weight: 40, setReps: [12], effort: null }))).toBe(56);
  });

  it('skips bodyweight and long sets', () => {
    expect(e1rm(entry({ weight: 0 }))).toBeNull();
    expect(e1rm(entry({ reps: 30, setReps: null }))).toBeNull();
  });
});
