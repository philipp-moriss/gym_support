import { diffExercise, diffSettings, formatWeeks } from '../services/changes';

const base = {
  name: 'Жим',
  base: 40,
  step: 2.5,
  weeks: null,
  days: [],
  tips: [],
  alternativeOf: null,
};

describe('program change diff', () => {
  it('describes weight changes in kg and ignores untouched fields', () => {
    expect(diffExercise(base, { ...base, base: 42.5 })).toEqual([
      { field: 'base', before: '40 кг', after: '42.5 кг' },
    ]);
    expect(diffExercise(base, { ...base })).toEqual([]);
  });

  it('formats a weekly plan in one line', () => {
    expect(
      formatWeeks([
        { sets: 3, reps: 12, repsMax: 15 },
        { sets: 4, reps: 15, weight: 20 },
      ]),
    ).toBe('3×12–15 · 4×15 @20 кг');
  });

  it('describes days and schedule', () => {
    expect(diffExercise(base, { ...base, days: [0, 2] })).toEqual([
      { field: 'days', before: 'все дни тренировок', after: 'пн, ср' },
    ]);
    const day = (gym: 'yes' | 'no' | 'optional') => ({
      gym,
      title: '',
      extras: [],
    });
    const settings = {
      startDate: '2026-10-12',
      resetAt: null,
      swaps: {},
      rules: [],
      schedule: [
        day('yes'),
        day('no'),
        day('yes'),
        day('no'),
        day('no'),
        day('no'),
        day('no'),
      ],
    };
    expect(
      diffSettings(settings, {
        ...settings,
        schedule: settings.schedule.map((d, i) =>
          i === 4 ? day('optional') : d,
        ),
      }),
    ).toEqual([{ field: 'schedule', before: 'пн, ср', after: 'пн, ср, пт?' }]);
  });
});
