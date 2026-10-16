import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/** Полный сценарий на настоящей базе (docker compose ... up -d postgres). */
describe('journal flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => app.close());

  it('register → program → entry → logout → login by code → data is there', async () => {
    const http = request(app.getHttpServer());
    const reg = await http.post('/api/auth/register').send({}).expect(201);
    const { code, user, accessToken, refreshToken } = reg.body;
    expect(code).toMatch(/^\d{6}$/);
    const auth = { Authorization: `Bearer ${accessToken}` };

    const program = await http.get('/api/program').set(auth).expect(200);
    expect(program.body.exercises.map((e: { id: string }) => e.id)).toContain(
      'bench',
    );
    expect(program.body.settings.schedule).toHaveLength(7);

    await http
      .post('/api/journal/entries')
      .set(auth)
      .send({
        date: '2026-10-12',
        week: 1,
        exerciseId: 'bench',
        exercise: 'Жим штанги лёжа',
        sets: 3,
        reps: 12,
        weight: 30,
        pain: 0,
        effort: 5,
      })
      .expect(201);

    await http.post('/api/auth/logout').send({ refreshToken }).expect(204);
    await http.post('/api/auth/refresh').send({ refreshToken }).expect(401);

    await http
      .post('/api/auth/login')
      .send({
        login: user.login,
        code: code === '000000' ? '111111' : '000000',
      })
      .expect(401);
    const login = await http
      .post('/api/auth/login')
      .send({ login: user.login, code })
      .expect(200);

    const entries = await http
      .get('/api/journal/entries')
      .set({ Authorization: `Bearer ${login.body.accessToken}` })
      .expect(200);
    expect(entries.body).toHaveLength(1);
    expect(entries.body[0]).toMatchObject({ exerciseId: 'bench', weight: 30 });
  });

  it('change code: wrong current code is 403, new code works, old tokens and code do not', async () => {
    const http = request(app.getHttpServer());
    const reg = (
      await http.post('/api/auth/register').send({ template: 'empty' })
    ).body;
    const auth = { Authorization: `Bearer ${reg.accessToken}` };
    const wrong = reg.code === '000000' ? '111111' : '000000';

    await http
      .post('/api/auth/code')
      .send({ currentCode: reg.code })
      .expect(401);
    await http
      .post('/api/auth/code')
      .set(auth)
      .send({ currentCode: '12' })
      .expect(400);
    await http
      .post('/api/auth/code')
      .set(auth)
      .send({ currentCode: wrong })
      .expect(403);
    // Неверный код не трогает сессию.
    await http.get('/api/auth/me').set(auth).expect(200);

    const changed = await http
      .post('/api/auth/code')
      .set(auth)
      .send({ currentCode: reg.code })
      .expect(200);
    const { code, accessToken, refreshToken, user } = changed.body;
    expect(code).toMatch(/^\d{6}$/);
    expect(user.login).toBe(reg.user.login);

    await http.get('/api/auth/me').set(auth).expect(401);
    await http
      .post('/api/auth/refresh')
      .send({ refreshToken: reg.refreshToken })
      .expect(401);
    await http
      .get('/api/auth/me')
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(200);
    await http.post('/api/auth/refresh').send({ refreshToken }).expect(200);

    if (code !== reg.code) {
      await http
        .post('/api/auth/login')
        .send({ login: user.login, code: reg.code })
        .expect(401);
    }
    await http
      .post('/api/auth/login')
      .send({ login: user.login, code })
      .expect(200);
  });

  it('import skips duplicates; data is per account', async () => {
    const http = request(app.getHttpServer());
    const a = (
      await http.post('/api/auth/register').send({ template: 'empty' })
    ).body;
    const b = (await http.post('/api/auth/register').send({})).body;
    const row = {
      date: '2026-10-05',
      exercise: 'Планка',
      sets: 3,
      reps: 30,
      weight: 0,
    };
    const first = await http
      .post('/api/journal/entries/import')
      .set({ Authorization: `Bearer ${a.accessToken}` })
      .send({ entries: [row, row, { ...row, reps: 40 }] })
      .expect(200);
    expect(first.body).toEqual({ added: 2, skipped: 1 });

    const again = await http
      .post('/api/journal/entries/import')
      .set({ Authorization: `Bearer ${a.accessToken}` })
      .send({ entries: [row] })
      .expect(200);
    expect(again.body).toEqual({ added: 0, skipped: 1 });

    const other = await http
      .get('/api/journal/entries')
      .set({ Authorization: `Bearer ${b.accessToken}` })
      .expect(200);
    expect(other.body).toHaveLength(0);

    const empty = await http
      .get('/api/program')
      .set({ Authorization: `Bearer ${a.accessToken}` })
      .expect(200);
    expect(empty.body.exercises).toHaveLength(0);
  });

  it('custom exercise needs either base or weekly plan', async () => {
    const http = request(app.getHttpServer());
    const { accessToken } = (
      await http.post('/api/auth/register').send({ template: 'empty' })
    ).body;
    const auth = { Authorization: `Bearer ${accessToken}` };
    const base = {
      name: 'Жим гантелей сидя',
      muscle: 'shoulders',
      group: 'main',
      unit: 'reps',
      step: 2,
      days: [0, 3],
    };
    await http.post('/api/program/exercises').set(auth).send(base).expect(400);
    const created = await http
      .post('/api/program/exercises')
      .set(auth)
      .send({ ...base, base: 16 })
      .expect(201);
    expect(created.body).toMatchObject({
      short: 'Жим гантелей сидя',
      base: 16,
      days: [0, 3],
    });
    expect(created.body.id).toMatch(/^c-/);
  });
});
