import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/** Бассейн и велик на настоящей базе (docker compose ... up -d postgres). */
describe('activities (e2e)', () => {
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

  const http = () => request(app.getHttpServer());
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function client() {
    const res = await http()
      .post('/api/auth/register')
      .send({ template: 'empty' })
      .expect(201);
    return bearer(res.body.accessToken as string);
  }

  it('client logs swim and bike, edits and deletes them; others cannot', async () => {
    const auth = await client();

    const swim = await http()
      .post('/api/journal/activities')
      .set(auth)
      .send({
        date: '2026-11-17',
        kind: 'swim',
        poolLength: 25,
        laps: 40,
        durationSec: 1350,
      })
      .expect(201);
    expect(swim.body).toMatchObject({
      kind: 'swim',
      poolLength: 25,
      laps: 40,
      distanceM: 1000,
      durationSec: 1350,
      notes: '',
    });

    const bike = await http()
      .post('/api/journal/activities')
      .set(auth)
      .send({
        date: '2026-11-16',
        kind: 'bike',
        distanceM: 32_400,
        durationSec: 4320,
        notes: ' по набережной ',
      })
      .expect(201);
    expect(bike.body).toMatchObject({
      kind: 'bike',
      poolLength: null,
      laps: null,
      distanceM: 32_400,
      notes: 'по набережной',
    });

    // Поля чужого вида и отсутствие нужных — 400.
    await http()
      .post('/api/journal/activities')
      .set(auth)
      .send({ date: '2026-11-17', kind: 'bike', laps: 3, durationSec: 60 })
      .expect(400);
    await http()
      .post('/api/journal/activities')
      .set(auth)
      .send({ date: '2026-11-17', kind: 'swim', laps: 3, durationSec: 60 })
      .expect(400);
    await http()
      .post('/api/journal/activities')
      .set(auth)
      .send({
        date: '2026-11-17',
        kind: 'run',
        distanceM: 5000,
        durationSec: 60,
      })
      .expect(400);

    // Правка только кругов пересчитывает дистанцию; вид не меняется.
    const edited = await http()
      .patch(`/api/journal/activities/${swim.body.id}`)
      .set(auth)
      .send({ laps: 60, kind: 'bike' })
      .expect(200);
    expect(edited.body).toMatchObject({
      kind: 'swim',
      laps: 60,
      distanceM: 1500,
    });

    const list = await http()
      .get('/api/journal/activities')
      .set(auth)
      .expect(200);
    expect(list.body.map((a: { id: string }) => a.id)).toEqual([
      swim.body.id,
      bike.body.id,
    ]);

    // Чужое не видно и не правится.
    const other = await client();
    const otherList = await http()
      .get('/api/journal/activities')
      .set(other)
      .expect(200);
    expect(otherList.body).toEqual([]);
    await http()
      .patch(`/api/journal/activities/${bike.body.id}`)
      .set(other)
      .send({ durationSec: 10 })
      .expect(404);
    await http()
      .delete(`/api/journal/activities/${bike.body.id}`)
      .set(other)
      .expect(404);

    await http()
      .delete(`/api/journal/activities/${bike.body.id}`)
      .set(auth)
      .expect(204);

    // Сброс дневника удаляет и кардио.
    await http().delete('/api/journal').set(auth).expect(204);
    const empty = await http()
      .get('/api/journal/activities')
      .set(auth)
      .expect(200);
    expect(empty.body).toEqual([]);
  });

  it('coach reads client activities but cannot change them', async () => {
    const admin = await http()
      .post('/api/admin/auth/login')
      .send({
        login: process.env.ADMIN_LOGIN ?? 'admin',
        password: process.env.ADMIN_PASSWORD ?? 'dev-admin-password',
      })
      .expect(200);
    const coach = await http()
      .post('/api/admin/coaches')
      .set(bearer(admin.body.accessToken))
      .send({ name: 'Тренер кардио' })
      .expect(201);
    const coachLogin = await http()
      .post('/api/auth/login/code')
      .send({ code: coach.body.code })
      .expect(200);
    const coachAuth = bearer(coachLogin.body.accessToken);

    const created = await http()
      .post('/api/coach/clients')
      .set(coachAuth)
      .send({ name: 'Пловец', template: 'back' })
      .expect(201);
    const clientLogin = await http()
      .post('/api/auth/login/code')
      .send({ code: created.body.code })
      .expect(200);
    const clientAuth = bearer(clientLogin.body.accessToken);
    const swim = await http()
      .post('/api/journal/activities')
      .set(clientAuth)
      .send({
        date: '2026-11-17',
        kind: 'swim',
        poolLength: 50,
        laps: 20,
        durationSec: 1500,
      })
      .expect(201);

    const asClient = {
      ...coachAuth,
      'X-Client-Id': created.body.client.id as string,
    };
    const seen = await http()
      .get('/api/journal/activities')
      .set(asClient)
      .expect(200);
    expect(seen.body).toEqual([
      expect.objectContaining({ id: swim.body.id, distanceM: 1000 }),
    ]);

    await http()
      .post('/api/journal/activities')
      .set(asClient)
      .send({
        date: '2026-11-17',
        kind: 'bike',
        distanceM: 1000,
        durationSec: 60,
      })
      .expect(403);
    await http()
      .patch(`/api/journal/activities/${swim.body.id}`)
      .set(asClient)
      .send({ laps: 1 })
      .expect(403);
    await http()
      .delete(`/api/journal/activities/${swim.body.id}`)
      .set(asClient)
      .expect(403);
  });
});
