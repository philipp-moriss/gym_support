import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AI_AGENT, type AiAgent } from '../src/shared';

/** Ответы агента вместо настоящего ИИ. */
const agent: AiAgent = {
  run: (slot) =>
    Promise.resolve(
      slot === 'journal_analysis'
        ? {
            summary: 'Стабильно, легко.',
            progress: [{ exerciseId: 'bench', trend: 'up', note: '+5 кг' }],
            concerns: [],
          }
        : {
            summary: 'Поднимаем жим.',
            changes: [
              { exerciseId: 'bench', base: 32.5, reason: 'сложность 3' },
              { exerciseId: 'ghost', base: 1, reason: 'нет такого' },
            ],
            ideas: ['Добавить растяжку'],
          },
    ),
};

/** Сценарий тренера на настоящей базе (docker compose ... up -d postgres). */
describe('coaching flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_AGENT)
      .useValue(agent)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function adminToken() {
    const res = await http()
      .post('/api/admin/auth/login')
      .send({
        login: process.env.ADMIN_LOGIN ?? 'admin',
        password: process.env.ADMIN_PASSWORD ?? 'dev-admin-password',
      })
      .expect(200);
    return res.body.accessToken as string;
  }

  async function coachToken() {
    const admin = await adminToken();
    const created = await http()
      .post('/api/admin/coaches')
      .set(bearer(admin))
      .send({ name: 'Тренер E2E' })
      .expect(201);
    const login = await http()
      .post('/api/auth/login/code')
      .send({ code: created.body.code })
      .expect(200);
    expect(login.body.user).toMatchObject({
      role: 'coach',
      name: 'Тренер E2E',
    });
    return {
      token: login.body.accessToken as string,
      id: created.body.coach.id as string,
      admin,
    };
  }

  it('admin creates a coach, coach creates a client and edits the client program; client sees the change', async () => {
    const coach = await coachToken();

    // Своей программы у тренера нет, кабинет клиента ему закрыт.
    await http().get('/api/program').set(bearer(coach.token)).expect(403);

    const created = await http()
      .post('/api/coach/clients')
      .set(bearer(coach.token))
      .send({ name: 'Анна', template: 'back' })
      .expect(201);
    const clientId = created.body.client.id as string;
    expect(created.body.code).toMatch(/^\d{8}$/);

    const asClient = { ...bearer(coach.token), 'X-Client-Id': clientId };
    const program = await http().get('/api/program').set(asClient).expect(200);
    const bench = program.body.exercises.find(
      (e: { id: string }) => e.id === 'bench',
    );
    await http()
      .patch('/api/program/exercises/bench')
      .set(asClient)
      .send({ base: (bench.base ?? 20) + 5 })
      .expect(200);

    // Журнал клиента — только чтение; черновики закрыты.
    await http().get('/api/journal/entries').set(asClient).expect(200);
    await http()
      .post('/api/journal/entries')
      .set(asClient)
      .send({ date: '2026-10-12', exercise: 'x', sets: 1, reps: 1, weight: 0 })
      .expect(403);
    await http().get('/api/journal/drafts').set(asClient).expect(403);

    const client = await http()
      .post('/api/auth/login/code')
      .send({ code: created.body.code })
      .expect(200);
    const clientAuth = bearer(client.body.accessToken);
    const unseen = await http()
      .get('/api/program/changes?unseen=true')
      .set(clientAuth)
      .expect(200);
    expect(unseen.body).toEqual([
      expect.objectContaining({
        exerciseId: 'bench',
        field: 'base',
        actorId: coach.id,
        source: 'manual',
      }),
    ]);
    await http().post('/api/program/changes/seen').set(clientAuth).expect(204);
    const after = await http()
      .get('/api/program/changes?unseen=true')
      .set(clientAuth)
      .expect(200);
    expect(after.body).toEqual([]);

    // Клиенту кабинет тренера закрыт; видит, кто его тренер.
    await http().get('/api/coach/clients').set(clientAuth).expect(403);
    const mine = await http()
      .get('/api/coaching/coach')
      .set(clientAuth)
      .expect(200);
    expect(mine.body.coach.name).toBe('Тренер E2E');
  });

  it('coach cannot act on a client who is not linked; invite links an existing client', async () => {
    const coach = await coachToken();
    const stranger = await http()
      .post('/api/auth/register')
      .send({})
      .expect(201);
    const strangerId = stranger.body.user.id as string;
    await http()
      .get('/api/program')
      .set({ ...bearer(coach.token), 'X-Client-Id': strangerId })
      .expect(403);
    // Клиент не может притвориться тренером.
    await http()
      .get('/api/program')
      .set({ ...bearer(stranger.body.accessToken), 'X-Client-Id': strangerId })
      .expect(403);

    const invite = await http()
      .post('/api/coach/invites')
      .set(bearer(coach.token))
      .expect(201);
    await http()
      .post('/api/coaching/link')
      .set(bearer(stranger.body.accessToken))
      .send({ code: invite.body.code.toLowerCase() })
      .expect(200);
    await http()
      .get('/api/program')
      .set({ ...bearer(coach.token), 'X-Client-Id': strangerId })
      .expect(200);
    // Инвайт одноразовый.
    const other = await http().post('/api/auth/register').send({}).expect(201);
    await http()
      .post('/api/coaching/link')
      .set(bearer(other.body.accessToken))
      .send({ code: invite.body.code })
      .expect(400);
  });

  it('AI analysis runs in the background, drops invalid changes and applies the chosen ones', async () => {
    const coach = await coachToken();
    const created = await http()
      .post('/api/coach/clients')
      .set(bearer(coach.token))
      .send({ name: 'Борис' })
      .expect(201);
    const clientId = created.body.client.id as string;
    const base = `/api/coach/clients/${clientId}`;
    await http()
      .put(`${base}/notes`)
      .set(bearer(coach.token))
      .send({ text: 'Грыжа L5-S1, без осевой нагрузки' })
      .expect(200);

    const started = await http()
      .post(`${base}/analyses`)
      .set(bearer(coach.token))
      .expect(202);
    let analysis = started.body;
    for (let i = 0; i < 50 && analysis.status === 'pending'; i++) {
      await new Promise((r) => setTimeout(r, 100));
      analysis = (
        await http()
          .get(`${base}/analyses/${started.body.id}`)
          .set(bearer(coach.token))
          .expect(200)
      ).body;
    }
    expect(analysis.status).toBe('ready');
    expect(analysis.result.program.changes).toHaveLength(1);
    expect(analysis.result.program.dropped).toBe(1);

    const change = analysis.result.program.changes[0];
    await http()
      .post(`${base}/analyses/${analysis.id}/apply`)
      .set(bearer(coach.token))
      .send({
        changes: [
          { exerciseId: change.exerciseId, base: 35, reason: change.reason },
        ],
      })
      .expect(200);
    const history = await http()
      .get(`${base}/changes`)
      .set(bearer(coach.token))
      .expect(200);
    expect(history.body[0]).toMatchObject({
      exerciseId: 'bench',
      after: '35 кг',
      source: 'ai',
      reason: 'сложность 3',
    });

    // Всё или ничего: неподходящая правка — 400, ничего не применено.
    await http()
      .post(`${base}/analyses/${analysis.id}/apply`)
      .set(bearer(coach.token))
      .send({
        changes: [
          { exerciseId: 'bench', base: 37.5, reason: 'r' },
          { exerciseId: 'ghost', base: 1, reason: 'r' },
        ],
      })
      .expect(400);
    const program = await http()
      .get('/api/program')
      .set({ ...bearer(coach.token), 'X-Client-Id': clientId })
      .expect(200);
    expect(
      program.body.exercises.find((e: { id: string }) => e.id === 'bench').base,
    ).toBe(35);
  });

  it('admin: disabled coach cannot sign in, user tokens do not open the admin', async () => {
    const coach = await coachToken();
    await http().get('/api/admin/coaches').set(bearer(coach.token)).expect(401);
    await http()
      .patch(`/api/admin/coaches/${coach.id}`)
      .set(bearer(coach.admin))
      .send({ disabled: true })
      .expect(200);
    await http().get('/api/coach/clients').set(bearer(coach.token)).expect(401);
    // Токен админки не подходит к API пользователя.
    await http().get('/api/auth/me').set(bearer(coach.admin)).expect(401);
    const prompts = await http()
      .get('/api/admin/prompts')
      .set(bearer(coach.admin))
      .expect(200);
    expect(prompts.body.map((p: { slot: string }) => p.slot)).toEqual([
      'journal_analysis',
      'program_review',
    ]);
  });
});
