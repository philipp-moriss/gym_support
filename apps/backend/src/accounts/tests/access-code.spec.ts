import {
  generateCode,
  generateLogin,
  hashCode,
  verifyCodeHash,
} from '../services/access-code';

describe('access code', () => {
  it('generates 6 digits and readable logins', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateCode()).toMatch(/^\d{6}$/);
      expect(generateLogin()).toMatch(/^[a-z]+-\d{4}$/);
    }
  });

  it('stores only a salted hash and verifies with the same pepper', async () => {
    const hash = await hashCode('042917', 'pepper');
    expect(hash).not.toContain('042917');
    expect(hash).not.toEqual(await hashCode('042917', 'pepper'));
    await expect(verifyCodeHash('042917', 'pepper', hash)).resolves.toBe(true);
    await expect(verifyCodeHash('042918', 'pepper', hash)).resolves.toBe(false);
    await expect(verifyCodeHash('042917', 'other', hash)).resolves.toBe(false);
    await expect(verifyCodeHash('042917', 'pepper', 'junk')).resolves.toBe(
      false,
    );
  });
});
