import { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import type { Account } from '../entities/account.entity';
import { hashCode } from '../services/access-code';
import {
  AccountsService,
  LOCK_MINUTES,
  MAX_ATTEMPTS,
} from '../services/accounts.service';

/** Репозиторий в памяти: одна запись, атомарный счётчик через query. */
function fakeRepo(account: Account) {
  return {
    findOneBy: jest.fn(({ login }: { login: string }) =>
      Promise.resolve(login === account.login ? { ...account } : null),
    ),
    update: jest.fn((_id: string, patch: Partial<Account>) => {
      Object.assign(account, patch);
      return Promise.resolve();
    }),
    query: jest.fn(() => {
      account.failedAttempts += 1;
      return Promise.resolve([[{ failedAttempts: account.failedAttempts }], 1]);
    }),
  } as unknown as Repository<Account>;
}

describe('AccountsService.verifyCode', () => {
  const config = new ConfigService({ CODE_PEPPER: 'pepper' });
  let account: Account;
  let service: AccountsService;

  beforeEach(async () => {
    account = {
      id: 'a1',
      login: 'otter-4821',
      codeHash: await hashCode('123456', 'pepper'),
      failedAttempts: 0,
      lockedUntil: null,
      sessionsVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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
