import { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import type { Account } from '../entities/account.entity';
import { hashCode, verifyCodeHash } from '../services/access-code';
import {
  AccountsService,
  LOCK_MINUTES,
  MAX_ATTEMPTS,
} from '../services/accounts.service';

/** Репозиторий в памяти: одна запись, атомарные UPDATE через query. */
function fakeRepo(account: Account) {
  return {
    findOneBy: jest.fn(({ login, id }: { login?: string; id?: string }) =>
      Promise.resolve(
        (login ? login === account.login : id === account.id)
          ? { ...account }
          : null,
      ),
    ),
    update: jest.fn((_id: string, patch: Partial<Account>) => {
      Object.assign(account, patch);
      return Promise.resolve();
    }),
    query: jest.fn((sql: string, params: unknown[]) => {
      if (sql.includes('"codeHash" = $2')) {
        Object.assign(account, {
          codeHash: params[1] as string,
          sessionsVersion: account.sessionsVersion + 1,
          failedAttempts: 0,
          lockedUntil: null,
        });
        return Promise.resolve([
          [{ sessionsVersion: account.sessionsVersion }],
          1,
        ]);
      }
      account.failedAttempts += 1;
      return Promise.resolve([[{ failedAttempts: account.failedAttempts }], 1]);
    }),
  } as unknown as Repository<Account>;
}

const makeAccount = async (): Promise<Account> => ({
  id: 'a1',
  login: 'otter-4821',
  codeHash: await hashCode('123456', 'pepper'),
  failedAttempts: 0,
  lockedUntil: null,
  sessionsVersion: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('AccountsService.verifyCode', () => {
  const config = new ConfigService({ CODE_PEPPER: 'pepper' });
  let account: Account;
  let service: AccountsService;

  beforeEach(async () => {
    account = await makeAccount();
    service = new AccountsService(fakeRepo(account), config);
  });

  it('accepts the right code, login is case-insensitive', async () => {
    const res = await service.verifyCode(' Otter-4821 ', '123456');
    expect(res).toMatchObject({ ok: true, account: { id: 'a1' } });
  });

  it('answers the same for unknown login and wrong code', async () => {
    await expect(service.verifyCode('nobody-1', '123456')).resolves.toEqual({
      ok: false,
      reason: 'invalid',
    });
    await expect(service.verifyCode('otter-4821', '000000')).resolves.toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it(`locks for ${LOCK_MINUTES} minutes after ${MAX_ATTEMPTS} wrong codes, even for the right one`, async () => {
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      await expect(
        service.verifyCode('otter-4821', '000000'),
      ).resolves.toMatchObject({ reason: 'invalid' });
    }
    const locked = await service.verifyCode('otter-4821', '000000');
    expect(locked).toMatchObject({ ok: false, reason: 'locked' });
    expect(account.lockedUntil).not.toBeNull();
    await expect(
      service.verifyCode('otter-4821', '123456'),
    ).resolves.toMatchObject({ reason: 'locked' });

    // Блокировка прошла — правильный код снова работает и сбрасывает счётчик.
    account.lockedUntil = new Date(Date.now() - 1000);
    await expect(
      service.verifyCode('otter-4821', '123456'),
    ).resolves.toMatchObject({ ok: true });
    expect(account.lockedUntil).toBeNull();
    expect(account.failedAttempts).toBe(0);
  });
});

describe('AccountsService.changeCode', () => {
  const config = new ConfigService({ CODE_PEPPER: 'pepper' });
  let account: Account;
  let service: AccountsService;

  beforeEach(async () => {
    account = await makeAccount();
    service = new AccountsService(fakeRepo(account), config);
  });

  it('issues a new code, stores only its hash and bumps sessionsVersion', async () => {
    const res = await service.changeCode('a1', '123456');
    if (!res.ok) throw new Error('expected ok');
    expect(res.code).toMatch(/^\d{6}$/);
    expect(res.account).toMatchObject({ id: 'a1', sessionsVersion: 1 });
    expect(account.codeHash).not.toContain(res.code);
    await expect(
      verifyCodeHash(res.code, 'pepper', account.codeHash),
    ).resolves.toBe(true);
    await expect(
      service.verifyCode('otter-4821', res.code),
    ).resolves.toMatchObject({ ok: true });
    if (res.code !== '123456') {
      await expect(
        service.verifyCode('otter-4821', '123456'),
      ).resolves.toMatchObject({ reason: 'invalid' });
    }
  });

  it('keeps the code on a wrong current code and shares the attempt limit with login', async () => {
    const before = account.codeHash;
    await expect(service.changeCode('a1', '000000')).resolves.toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(account.codeHash).toBe(before);
    expect(account.sessionsVersion).toBe(0);

    for (let i = 2; i < MAX_ATTEMPTS; i++) {
      await service.verifyCode('otter-4821', '000000');
    }
    await expect(service.changeCode('a1', '000000')).resolves.toMatchObject({
      ok: false,
      reason: 'locked',
    });
    await expect(service.changeCode('a1', '123456')).resolves.toMatchObject({
      reason: 'locked',
    });
    await expect(
      service.verifyCode('otter-4821', '123456'),
    ).resolves.toMatchObject({ reason: 'locked' });
    expect(account.codeHash).toBe(before);
  });

  it('unknown account is just invalid', async () => {
    await expect(service.changeCode('nope', '123456')).resolves.toEqual({
      ok: false,
      reason: 'invalid',
    });
  });
});
