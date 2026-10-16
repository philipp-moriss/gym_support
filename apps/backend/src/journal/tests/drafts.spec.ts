import { sanitizeDraft } from '../services/drafts.service';

describe('sanitizeDraft', () => {
  it('keeps known fields within limits', () => {
    expect(
      sanitizeDraft({
        weight: 32.5,
        sets: 3,
        reps: 12,
        pain: 14,
        effort: -2,
        notes: 'ok',
        evil: '<script>',
      }),
    ).toEqual({
      weight: 32.5,
      sets: 3,
      reps: 12,
      pain: 10,
      effort: 0,
      notes: 'ok',
    });
  });

  it('fills defaults and rejects non-objects', () => {
    expect(sanitizeDraft({})).toEqual({
      weight: 0,
      sets: 1,
      reps: 1,
      pain: 0,
      effort: 5,
      notes: '',
    });
    expect(sanitizeDraft('x')).toBeNull();
    expect(sanitizeDraft(null)).toBeNull();
  });
});
