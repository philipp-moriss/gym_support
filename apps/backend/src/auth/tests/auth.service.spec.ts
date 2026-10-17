import { ForbiddenException, HttpException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { AccountRecord, Accounts, ProgramSeeder } from '../../shared';
import { AuthService } from '../services/auth.service';
import type { SessionsService } from '../services/sessions.service';

describe('AuthService.changeCode', () => {
  const account: AccountRecord = {
    id: 'a1',
    login: 'otter-4821',
    role: 'client',
    name: null,
    disabled: false,
    aiDailyLimit: null,
    sessionsVersion: 3,
    codeDigits: 8,
    createdAt: new Date(),
  };
  const user = { id: 'a1', login: 'otter-4821', role: 'client' as const };
  let accounts: jest.Mocked<Pick<Accounts, 'changeCode'>>;
  let sessions: { create: jest.Mock };
  let jwt: { signAsync: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    accounts = { changeCode: jest.fn() };
    sessions = { create: jest.fn().mockResolvedValue('refresh-new') };
    jwt = { signAsync: jest.fn().mockResolvedValue('access-new') };
    service = new AuthService(
      accounts as unknown as Accounts,
      {} as ProgramSeeder,
      sessions as unknown as SessionsService,
      jwt as unknown as JwtService,
    );
  });

  it('returns a fresh token pair for the new sessionsVersion and the code', async () => {
    accounts.changeCode.mockResolvedValue({
      ok: true,
      account,
      code: '654321',
    });
    await expect(service.changeCode(user, '123456', 'ua')).resolves.toEqual({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
      user: {
        id: 'a1',
        login: 'otter-4821',
        role: 'client',
        name: null,
        codeDigits: 8,
        createdAt: account.createdAt,
      },
      code: '654321',
    });
    expect(accounts.changeCode).toHaveBeenCalledWith('a1', '123456');
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'a1', ver: 3 });
    expect(sessions.create).toHaveBeenCalledWith('a1', 3, 'ua');
  });

  it('wrong current code is 403, so the client does not refresh and retry', async () => {
    accounts.changeCode.mockResolvedValue({ ok: false, reason: 'invalid' });
    await expect(service.changeCode(user, '000000')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('lock is 429 with retryAfterSec', async () => {
    accounts.changeCode.mockResolvedValue({
      ok: false,
      reason: 'locked',
      retryAfterSec: 900,
    });
    const error: unknown = await service
      .changeCode(user, '000000')
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    expect((error as HttpException).getResponse()).toMatchObject({
      retryAfterSec: 900,
    });
  });
});
