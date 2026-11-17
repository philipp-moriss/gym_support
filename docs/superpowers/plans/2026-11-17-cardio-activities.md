# Доп. тренировки (бассейн, велик): план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Клиент записывает бассейн (дорожка × сколько раз + время) и велик (км + время) как доп. тренировку. Кардио видно на «Сегодня» и в «Дневнике», тренер видит его только на чтение.

**Architecture:** Новая таблица `activities` в модуле `journal` с четырьмя маршрутами под `/api/journal/activities`. Сочетание полей с видом проверяет чистая функция `activityDistance`. В web новая сущность `entities/activity` (типы, расчёт скорости и темпа, запрос, строка-плашка) и фича `features/log-activity` (форма, мутации, блок на «Сегодня»). `widgets/journal-list` показывает кардио в днях.

**Tech Stack:** NestJS 11, TypeORM 1.x, PostgreSQL, class-validator, Jest + supertest; React 19, TanStack Query 5, Tailwind, lucide-react.

**Спека:** `docs/superpowers/specs/2026-11-17-cardio-activities-design.md`

**Ветка:** `feature/cardio-activities` (уже создана).

---

## Файлы

**Backend (`apps/backend`)**
- Создать `src/journal/entities/activity.entity.ts`: сущность `Activity`, `ACTIVITY_KINDS`
- Создать `src/migrations/<timestamp>-Activities.ts`: таблица `activities`
- Изменить `src/journal/dto/journal.dto.ts`: `CreateActivityDto`, `UpdateActivityDto`
- Создать `src/journal/services/activities.service.ts`: `activityDistance` и `ActivitiesService`
- Создать `src/journal/tests/activities.spec.ts`: unit-тесты `activityDistance`
- Изменить `src/journal/journal.module.ts`: регистрация сущности и сервиса
- Изменить `src/journal/controllers/journal.controller.ts`: маршруты, сброс удаляет кардио
- Создать `test/activities.e2e-spec.ts`

**Web (`apps/web`)**
- Создать `src/entities/activity/model/types.ts`, `model/metrics.ts`, `api/queries.ts`, `ui/activity-line.tsx`, `index.ts`
- Изменить `src/app/router/guards.tsx`: сброс кэша кардио при смене клиента
- Создать `src/features/log-activity/model/form.ts`, `model/mutations.ts`, `ui/activity-form.tsx`, `ui/today-activities.tsx`, `index.ts`
- Изменить `src/pages/today/ui/today-page.tsx`: блок «Доп. тренировки»
- Изменить `src/pages/journal/ui/journal-page.tsx` и `src/widgets/journal-list/ui/journal-list.tsx`: кардио в днях

---

### Task 1: Сущность `Activity` и миграция

**Files:**
- Create: `apps/backend/src/journal/entities/activity.entity.ts`
- Create: `apps/backend/src/migrations/<timestamp>-Activities.ts` (генерируется)
- Modify: `apps/backend/src/journal/journal.module.ts`

- [ ] **Step 1: Создать сущность**

`apps/backend/src/journal/entities/activity.entity.ts`:

```ts
import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BaseEntity } from '../../shared';

export const ACTIVITY_KINDS = ['swim', 'bike'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** Доп. тренировка: бассейн или велосипед. С программой и прогрессией не связана. */
@Entity('activities')
@Index(['userId', 'date'])
export class Activity extends BaseEntity {
  @ForeignKey('accounts', {
    name: 'FK_activities_account',
    onDelete: 'CASCADE',
  })
  @Column('uuid')
  userId: string;

  /** YYYY-MM-DD по часам пользователя. */
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 10 })
  kind: ActivityKind;

  /** Бассейн: длина дорожки, м. */
  @Column({ type: 'smallint', nullable: true })
  poolLength: number | null;

  /** Бассейн: сколько раз проплыл дорожку. */
  @Column({ type: 'int', nullable: true })
  laps: number | null;

  /** Дистанция, м. У бассейна всегда poolLength × laps. */
  @Column({ type: 'int' })
  distanceM: number;

  @Column({ type: 'int' })
  durationSec: number;

  @Column({ type: 'text', default: '' })
  notes: string;
}
```

- [ ] **Step 2: Зарегистрировать сущность в модуле**

В `apps/backend/src/journal/journal.module.ts` заменить строку импорта TypeORM и добавить импорт сущности:

```ts
import { Activity } from './entities/activity.entity';
```

```ts
  imports: [TypeOrmModule.forFeature([Entry, Drafts, Activity])],
```

- [ ] **Step 3: Сгенерировать миграцию**

Postgres должен быть запущен:

```bash
cd /Users/philip_moriss/my-app/training && docker compose -f docker-compose.dev.yml up -d postgres
```

```bash
cd /Users/philip_moriss/my-app/training/apps/backend && npm run migration:generate -- src/migrations/Activities
```

Ожидается файл `src/migrations/<timestamp>-Activities.ts`. В `up` должны быть ровно три запроса: `CREATE TABLE "activities"` с колонками `id uuid`, `createdAt timestamptz`, `updatedAt timestamptz`, `userId uuid NOT NULL`, `date date NOT NULL`, `kind varchar(10) NOT NULL`, `poolLength smallint`, `laps integer`, `distanceM integer NOT NULL`, `durationSec integer NOT NULL`, `notes text NOT NULL DEFAULT ''`; `CREATE INDEX ... ON "activities" ("userId", "date")`; `ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_account" ... ON DELETE CASCADE`. Если генератор захватил изменения других таблиц, их убрать: схема прочих таблиц меняться не должна.

- [ ] **Step 4: Проверить, что сборка проходит и миграция применяется**

```bash
cd /Users/philip_moriss/my-app/training/apps/backend && npm run build && npm run migration:run
```

Ожидается: сборка без ошибок, `Migration Activities<timestamp> has been executed successfully.`

- [ ] **Step 5: Commit**

```bash
cd /Users/philip_moriss/my-app/training && git add apps/backend/src/journal/entities/activity.entity.ts apps/backend/src/journal/journal.module.ts apps/backend/src/migrations/*-Activities.ts && git commit -m "Activities table for swim and bike workouts"
```

---

### Task 2: `activityDistance`: правила вида (TDD)

**Files:**
- Create: `apps/backend/src/journal/services/activities.service.ts`
- Test: `apps/backend/src/journal/tests/activities.spec.ts`

- [ ] **Step 1: Написать падающий тест**

`apps/backend/src/journal/tests/activities.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { activityDistance } from '../services/activities.service';

describe('activityDistance', () => {
  it('swim: distance is pool length × laps', () => {
    expect(activityDistance('swim', { poolLength: 25, laps: 40 })).toEqual({
      poolLength: 25,
      laps: 40,
      distanceM: 1000,
    });
  });

  it('swim: needs pool length and laps, rejects explicit distance', () => {
    expect(() => activityDistance('swim', { laps: 40 })).toThrow(
      BadRequestException,
    );
    expect(() => activityDistance('swim', { poolLength: 25 })).toThrow(
      BadRequestException,
    );
    expect(() =>
      activityDistance('swim', { poolLength: 25, laps: 4, distanceM: 5000 }),
    ).toThrow(BadRequestException);
  });

  it('bike: takes distance, no pool fields', () => {
    expect(activityDistance('bike', { distanceM: 32_400 })).toEqual({
      poolLength: null,
      laps: null,
      distanceM: 32_400,
    });
    expect(() => activityDistance('bike', {})).toThrow(BadRequestException);
    expect(() =>
      activityDistance('bike', { distanceM: 10_000, laps: 3 }),
    ).toThrow(BadRequestException);
    expect(() =>
      activityDistance('bike', { distanceM: 10_000, poolLength: 25 }),
    ).toThrow(BadRequestException);
  });

  it('null pool fields count as absent', () => {
    expect(
      activityDistance('bike', {
        distanceM: 5000,
        poolLength: null,
        laps: null,
      }),
    ).toEqual({ poolLength: null, laps: null, distanceM: 5000 });
  });
});
```

- [ ] **Step 2: Убедиться, что тест падает**

```bash
cd /Users/philip_moriss/my-app/training/apps/backend && npx jest src/journal/tests/activities.spec.ts
```

Ожидается: FAIL, `Cannot find module '../services/activities.service'`.

- [ ] **Step 3: Минимальная реализация**

`apps/backend/src/journal/services/activities.service.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import type { ActivityKind } from '../entities/activity.entity';

export interface DistanceFields {
  poolLength?: number | null;
  laps?: number | null;
  distanceM?: number | null;
}

/**
 * Поля дистанции по виду. Бассейн: дорожка × сколько раз, дистанцию считаем сами.
 * Велик: дистанция как есть, полей бассейна быть не должно.
 */
export function activityDistance(
  kind: ActivityKind,
  f: DistanceFields,
): { poolLength: number | null; laps: number | null; distanceM: number } {
  if (kind === 'swim') {
    if (f.distanceM != null)
      throw new BadRequestException(
        'У бассейна дистанция считается из дорожки и кругов',
      );
    if (f.poolLength == null || f.laps == null)
      throw new BadRequestException(
        'Для бассейна нужны длина дорожки и сколько раз',
      );
    return {
      poolLength: f.poolLength,
      laps: f.laps,
      distanceM: f.poolLength * f.laps,
    };
  }
  if (f.poolLength != null || f.laps != null)
    throw new BadRequestException('У велосипеда нет дорожки и кругов');
  if (f.distanceM == null)
    throw new BadRequestException('Для велосипеда нужна дистанция');
  return { poolLength: null, laps: null, distanceM: f.distanceM };
}
```

- [ ] **Step 4: Убедиться, что тест проходит**

```bash
cd /Users/philip_moriss/my-app/training/apps/backend && npx jest src/journal/tests/activities.spec.ts
```

Ожидается: PASS, 4 теста.

- [ ] **Step 5: Commit**

```bash
cd /Users/philip_moriss/my-app/training && git add apps/backend/src/journal/services/activities.service.ts apps/backend/src/journal/tests/activities.spec.ts && git commit -m "activityDistance: swim and bike field rules"
```

---

### Task 3: DTO, сервис и маршруты

**Files:**
- Modify: `apps/backend/src/journal/dto/journal.dto.ts`
- Modify: `apps/backend/src/journal/services/activities.service.ts`
- Modify: `apps/backend/src/journal/journal.module.ts`
- Modify: `apps/backend/src/journal/controllers/journal.controller.ts`

- [ ] **Step 1: DTO**

В `apps/backend/src/journal/dto/journal.dto.ts` расширить импорты:

```ts
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
```

В импорт из `class-validator` добавить `IsIn`. Добавить импорт сущности:

```ts
import {
  ACTIVITY_KINDS,
  type ActivityKind,
} from '../entities/activity.entity';
```

В конец файла:

```ts
export class CreateActivityDto {
  @ApiProperty({ example: '2026-11-17' }) @Matches(ISO_DATE) date: string;

  @ApiProperty({ enum: ACTIVITY_KINDS })
  @IsIn(ACTIVITY_KINDS)
  kind: ActivityKind;

  @ApiPropertyOptional({ description: 'Бассейн: длина дорожки, м' })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  poolLength?: number;

  @ApiPropertyOptional({ description: 'Бассейн: сколько раз проплыл дорожку' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  laps?: number;

  @ApiPropertyOptional({ description: 'Велосипед: дистанция, м' })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(500_000)
  distanceM?: number;

  @ApiProperty({ description: 'Время, с' })
  @IsInt()
  @Min(1)
  @Max(86_400)
  durationSec: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

/** Вид не меняется: `kind` в правке отбрасывается (whitelist). */
export class UpdateActivityDto extends PartialType(
  OmitType(CreateActivityDto, ['kind'] as const),
) {}
```

- [ ] **Step 2: Сервис**

В `apps/backend/src/journal/services/activities.service.ts` заменить первую строку импорта и добавить импорты:

```ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CreateActivityDto,
  UpdateActivityDto,
} from '../dto/journal.dto';
import { Activity, type ActivityKind } from '../entities/activity.entity';
```

(строку `import type { ActivityKind } from '../entities/activity.entity';` удалить: тип теперь приходит из импорта выше.)

В конец файла:

```ts
const view = ({ userId: _userId, updatedAt: _u, ...rest }: Activity) => rest;

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private activities: Repository<Activity>,
  ) {}

  async list(userId: string) {
    const rows = await this.activities.find({
      where: { userId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return rows.map(view);
  }

  async create(userId: string, dto: CreateActivityDto) {
    const row = this.activities.create({
      userId,
      date: dto.date,
      kind: dto.kind,
      ...activityDistance(dto.kind, dto),
      durationSec: dto.durationSec,
      notes: dto.notes?.trim() ?? '',
    });
    return view(await this.activities.save(row));
  }

  /** Правка: вид не меняется, дистанция бассейна пересчитывается. */
  async update(userId: string, id: string, dto: UpdateActivityDto) {
    const cur = await this.activities.findOneBy({ userId, id });
    if (!cur) throw new NotFoundException();
    const distance = activityDistance(
      cur.kind,
      cur.kind === 'swim'
        ? {
            poolLength: dto.poolLength ?? cur.poolLength,
            laps: dto.laps ?? cur.laps,
            distanceM: dto.distanceM,
          }
        : {
            poolLength: dto.poolLength,
            laps: dto.laps,
            distanceM: dto.distanceM ?? cur.distanceM,
          },
    );
    return view(
      await this.activities.save({
        ...cur,
        ...distance,
        date: dto.date ?? cur.date,
        durationSec: dto.durationSec ?? cur.durationSec,
        notes: dto.notes !== undefined ? dto.notes.trim() : cur.notes,
      }),
    );
  }

  async remove(userId: string, id: string) {
    const { affected } = await this.activities.delete({ userId, id });
    if (!affected) throw new NotFoundException();
  }

  async removeAll(userId: string) {
    await this.activities.delete({ userId });
  }
}
```

- [ ] **Step 3: Провайдер в модуле**

В `apps/backend/src/journal/journal.module.ts`:

```ts
import { ActivitiesService } from './services/activities.service';
```

```ts
  providers: [
    EntriesService,
    DraftsService,
    ActivitiesService,
    { provide: JOURNAL, useExisting: EntriesService },
  ],
```

- [ ] **Step 4: Маршруты и сброс**

В `apps/backend/src/journal/controllers/journal.controller.ts`: в импорт DTO добавить `CreateActivityDto` и `UpdateActivityDto`, добавить

```ts
import { ActivitiesService } from '../services/activities.service';
```

Конструктор:

```ts
  constructor(
    private entries: EntriesService,
    private drafts: DraftsService,
    private activities: ActivitiesService,
  ) {}
```

Метод `clear` целиком:

```ts
  /** Полный сброс дневника: записи, кардио и черновики. */
  @Delete()
  @HttpCode(204)
  async clear(@CurrentUser() user: AuthUser) {
    await this.entries.removeAll(user.id);
    await this.activities.removeAll(user.id);
    await this.drafts.clear(user.id);
  }
```

После `putDrafts` добавить:

```ts
  /** Доп. тренировки (бассейн, велик), новые сверху. Тренер может читать. */
  @CoachAccess('read')
  @Get('activities')
  listActivities(@CurrentUser() user: AuthUser) {
    return this.activities.list(user.id);
  }

  @Post('activities')
  createActivity(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activities.create(user.id, dto);
  }

  @Patch('activities/:id')
  updateActivity(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activities.update(user.id, id, dto);
  }

  @Delete('activities/:id')
  @HttpCode(204)
  removeActivity(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.activities.remove(user.id, id);
  }
```

- [ ] **Step 5: Сборка, unit-тесты, линт, зависимости**

```bash
cd /Users/philip_moriss/my-app/training/apps/backend && npm run build && npm test && npm run lint && npm run lint:deps
```

Ожидается: всё зелёное.

- [ ] **Step 6: Commit**

```bash
cd /Users/philip_moriss/my-app/training && git add apps/backend/src/journal && git commit -m "Journal activities API: list, create, edit, delete; reset clears them"
```

---

### Task 4: e2e-сценарий кардио

**Files:**
- Create: `apps/backend/test/activities.e2e-spec.ts`

- [ ] **Step 1: Написать тест**

`apps/backend/test/activities.e2e-spec.ts`:

```ts
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
      .send({ date: '2026-11-17', kind: 'run', distanceM: 5000, durationSec: 60 })
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
      .send({ date: '2026-11-17', kind: 'bike', distanceM: 1000, durationSec: 60 })
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
```

- [ ] **Step 2: Прогнать e2e**

Postgres запущен (Task 1, Step 3).

```bash
cd /Users/philip_moriss/my-app/training/apps/backend && npm run test:e2e
```

Ожидается: PASS во всех трёх файлах (`app`, `coaching`, `activities`). Если у тренера `POST` вернул не 403: проверить, что на новых маршрутах нет `@CoachAccess` и `@Roles` (без пометки guard пускает только `client`).

- [ ] **Step 3: Commit**

```bash
cd /Users/philip_moriss/my-app/training && git add apps/backend/test/activities.e2e-spec.ts && git commit -m "e2e: activities for client and read-only coach"
```

---

### Task 5: Сущность `activity` в web

**Files:**
- Create: `apps/web/src/entities/activity/model/types.ts`
- Create: `apps/web/src/entities/activity/model/metrics.ts`
- Create: `apps/web/src/entities/activity/api/queries.ts`
- Create: `apps/web/src/entities/activity/ui/activity-line.tsx`
- Create: `apps/web/src/entities/activity/index.ts`
- Modify: `apps/web/src/app/router/guards.tsx`

- [ ] **Step 1: Типы**

`apps/web/src/entities/activity/model/types.ts`:

```ts
/** Копия бэкенда (journal, Swagger: тег journal, /journal/activities). */
export type ActivityKind = 'swim' | 'bike'

export interface Activity {
  id: string
  createdAt: string
  /** YYYY-MM-DD */
  date: string
  kind: ActivityKind
  /** Бассейн: длина дорожки, м */
  poolLength: number | null
  /** Бассейн: сколько раз проплыл дорожку */
  laps: number | null
  /** м; у бассейна — poolLength × laps */
  distanceM: number
  durationSec: number
  notes: string
}

export interface ActivityInput {
  date: string
  kind: ActivityKind
  poolLength?: number
  laps?: number
  /** Только велик */
  distanceM?: number
  durationSec: number
  notes?: string
}

/** Правка: вид не меняется. */
export type ActivityPatch = Partial<Omit<ActivityInput, 'kind'>>

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  swim: 'Бассейн',
  bike: 'Велосипед',
}
```

- [ ] **Step 2: Расчёты и форматирование**

`apps/web/src/entities/activity/model/metrics.ts`:

```ts
import { num } from '@/shared/lib'
import type { Activity } from './types'

const oneDecimal = (n: number) =>
  n.toLocaleString('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
const pad = (n: number) => String(n).padStart(2, '0')

/** Средняя скорость, км/ч. */
export const speedKmh = (distanceM: number, durationSec: number) =>
  durationSec > 0 ? (distanceM / durationSec) * 3.6 : 0

/** Темп, секунды на 100 м. */
export const pacePer100m = (distanceM: number, durationSec: number) =>
  distanceM > 0 ? (durationSec / distanceM) * 100 : 0

/** 1350 → «22:30», 4320 → «1:12:00». */
export function formatDuration(sec: number) {
  const s = Math.round(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`
}

/** Бассейн — в метрах («1 000 м»), велик — в км («32,4 км»). */
export const formatDistance = (kind: Activity['kind'], m: number) =>
  kind === 'swim' ? `${num(m)} м` : `${oneDecimal(m / 1000)} км`

/** Короткая сводка: дистанция, круги, время, темп или скорость. */
export function activityStats(
  a: Pick<Activity, 'kind' | 'poolLength' | 'laps' | 'distanceM' | 'durationSec'>,
) {
  const time = formatDuration(a.durationSec)
  if (a.kind === 'swim')
    return [
      formatDistance('swim', a.distanceM),
      `${a.laps}×${a.poolLength} м`,
      time,
      `${formatDuration(pacePer100m(a.distanceM, a.durationSec))}/100 м`,
    ]
  return [
    formatDistance('bike', a.distanceM),
    time,
    `${oneDecimal(speedKmh(a.distanceM, a.durationSec))} км/ч`,
  ]
}
```

- [ ] **Step 3: Запрос**

`apps/web/src/entities/activity/api/queries.ts`:

```ts
import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Activity } from '../model/types'

export const activitiesKey = ['journal', 'activities'] as const

export const activitiesQuery = () =>
  queryOptions({
    queryKey: activitiesKey,
    queryFn: () => api.get<Activity[]>('/journal/activities'),
  })

export const useActivities = () => useQuery(activitiesQuery())
```

- [ ] **Step 4: Строка-плашка**

`apps/web/src/entities/activity/ui/activity-line.tsx`:

```tsx
import { Bike, Waves } from 'lucide-react'
import { activityStats } from '../model/metrics'
import { ACTIVITY_LABEL, type Activity } from '../model/types'

/** Кардио одной строкой: иконка, вид, дистанция · время · темп/скорость, заметка. */
export function ActivityLine({ activity }: { activity: Activity }) {
  const Icon = activity.kind === 'swim' ? Waves : Bike
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
      <span className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{ACTIVITY_LABEL[activity.kind]}</span>
      </span>
      <span className="font-mono text-sm text-muted-foreground">
        {activityStats(activity).join(' · ')}
      </span>
      {activity.notes && (
        <span className="text-sm text-muted-foreground">{activity.notes}</span>
      )}
    </span>
  )
}
```

- [ ] **Step 5: Публичный API слайса**

`apps/web/src/entities/activity/index.ts`:

```ts
export { activitiesKey, activitiesQuery, useActivities } from './api/queries'
export {
  activityStats,
  formatDistance,
  formatDuration,
  pacePer100m,
  speedKmh,
} from './model/metrics'
export {
  ACTIVITY_LABEL,
  type Activity,
  type ActivityInput,
  type ActivityKind,
  type ActivityPatch,
} from './model/types'
export { ActivityLine } from './ui/activity-line'
```

- [ ] **Step 6: Сброс кэша при смене клиента у тренера**

В `apps/web/src/app/router/guards.tsx` добавить импорт:

```ts
import { activitiesKey } from '@/entities/activity'
```

и в `drop` внутри `CoachClientScope`:

```ts
    const drop = () => {
      queryClient.removeQueries({ queryKey: programKey })
      queryClient.removeQueries({ queryKey: entriesKey })
      queryClient.removeQueries({ queryKey: activitiesKey })
    }
```

- [ ] **Step 7: Проверка**

```bash
cd /Users/philip_moriss/my-app/training/apps/web && npm run typecheck && npm run lint && npm run lint:deps
```

Ожидается: без ошибок.

- [ ] **Step 8: Commit**

```bash
cd /Users/philip_moriss/my-app/training && git add apps/web/src/entities/activity apps/web/src/app/router/guards.tsx && git commit -m "Web: activity entity with pace and speed formatting"
```

---

### Task 6: Фича `log-activity`: форма и мутации

**Files:**
- Create: `apps/web/src/features/log-activity/model/form.ts`
- Create: `apps/web/src/features/log-activity/model/mutations.ts`
- Create: `apps/web/src/features/log-activity/ui/activity-form.tsx`
- Create: `apps/web/src/features/log-activity/index.ts`

- [ ] **Step 1: Состояние формы**

`apps/web/src/features/log-activity/model/form.ts`:

```ts
import type {
  Activity,
  ActivityInput,
  ActivityKind,
} from '@/entities/activity'

/** Поля формы. Бассейн: дорожка, круги, мин и сек. Велик: км, ч и мин. */
export interface ActivityFormState {
  kind: ActivityKind
  poolLength: number
  laps: number
  km: number
  hours: number
  minutes: number
  seconds: number
  notes: string
}

export const emptyForm = (kind: ActivityKind): ActivityFormState => ({
  kind,
  poolLength: 25,
  laps: 20,
  km: 20,
  hours: kind === 'bike' ? 1 : 0,
  minutes: kind === 'swim' ? 30 : 0,
  seconds: 0,
  notes: '',
})

export function formFromActivity(a: Activity): ActivityFormState {
  return {
    kind: a.kind,
    poolLength: a.poolLength ?? 25,
    laps: a.laps ?? 20,
    km: a.distanceM / 1000,
    hours: Math.floor(a.durationSec / 3600),
    minutes: Math.floor((a.durationSec % 3600) / 60),
    seconds: a.durationSec % 60,
    notes: a.notes,
  }
}

export const formDurationSec = (f: ActivityFormState) =>
  f.hours * 3600 + f.minutes * 60 + f.seconds

export const formDistanceM = (f: ActivityFormState) =>
  f.kind === 'swim' ? f.poolLength * f.laps : Math.round(f.km * 1000)

/** Те же границы, что у сервера. */
export function formValid(f: ActivityFormState) {
  const sec = formDurationSec(f)
  if (sec < 1 || sec > 86_400) return false
  if (f.kind === 'swim')
    return (
      f.poolLength >= 10 && f.poolLength <= 100 && f.laps >= 1 && f.laps <= 1000
    )
  const m = formDistanceM(f)
  return m >= 100 && m <= 500_000
}

export function formToInput(f: ActivityFormState, date: string): ActivityInput {
  const common = {
    date,
    kind: f.kind,
    durationSec: formDurationSec(f),
    notes: f.notes.trim(),
  }
  return f.kind === 'swim'
    ? { ...common, poolLength: f.poolLength, laps: f.laps }
    : { ...common, distanceM: formDistanceM(f) }
}
```

- [ ] **Step 2: Мутации с оптимистичным кэшем**

`apps/web/src/features/log-activity/model/mutations.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  activitiesKey,
  type Activity,
  type ActivityInput,
  type ActivityPatch,
} from '@/entities/activity'
import { api } from '@/shared/api'

/** Пока сервер не ответил, запись живёт с временным id и сразу видна в списке. */
export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActivityInput) =>
      api.post<Activity>('/journal/activities', input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: activitiesKey })
      const prev = queryClient.getQueryData<Activity[]>(activitiesKey)
      const tempId = `temp-${Date.now()}`
      const temp: Activity = {
        id: tempId,
        createdAt: new Date().toISOString(),
        date: input.date,
        kind: input.kind,
        poolLength: input.poolLength ?? null,
        laps: input.laps ?? null,
        distanceM:
          input.kind === 'swim'
            ? (input.poolLength ?? 0) * (input.laps ?? 0)
            : (input.distanceM ?? 0),
        durationSec: input.durationSec,
        notes: input.notes ?? '',
      }
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) => [
        temp,
        ...old,
      ])
      return { prev, tempId }
    },
    onSuccess: (saved, _input, ctx) =>
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) =>
        old.map((a) => (a.id === ctx?.tempId ? saved : a)),
      ),
    onError: (_error, _input, ctx) =>
      queryClient.setQueryData(activitiesKey, ctx?.prev),
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ActivityPatch }) =>
      api.patch<Activity>(`/journal/activities/${id}`, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: activitiesKey })
      const prev = queryClient.getQueryData<Activity[]>(activitiesKey)
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) =>
        old.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      )
      return { prev }
    },
    onSuccess: (saved) =>
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) =>
        old.map((a) => (a.id === saved.id ? saved : a)),
      ),
    onError: (_error, _vars, ctx) =>
      queryClient.setQueryData(activitiesKey, ctx?.prev),
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/journal/activities/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: activitiesKey })
      const prev = queryClient.getQueryData<Activity[]>(activitiesKey)
      queryClient.setQueryData<Activity[]>(activitiesKey, (old = []) =>
        old.filter((a) => a.id !== id),
      )
      return { prev }
    },
    onError: (_error, _id, ctx) =>
      queryClient.setQueryData(activitiesKey, ctx?.prev),
  })
}
```

- [ ] **Step 3: Форма**

`apps/web/src/features/log-activity/ui/activity-form.tsx`:

```tsx
import { useState } from 'react'
import {
  ACTIVITY_LABEL,
  activityStats,
  type Activity,
  type ActivityKind,
} from '@/entities/activity'
import { Button, Chip, Field, Stepper, Textarea } from '@/shared/ui'
import {
  emptyForm,
  formDistanceM,
  formDurationSec,
  formFromActivity,
  formToInput,
  formValid,
  type ActivityFormState,
} from '../model/form'
import { useCreateActivity, useUpdateActivity } from '../model/mutations'

const KINDS: ActivityKind[] = ['swim', 'bike']
const POOLS = [25, 50]

/**
 * Запись или правка кардио. Без `activity` — новая запись за `date`
 * с выбором вида; с `activity` — правка, вид не меняется.
 */
export function ActivityForm({
  activity,
  date,
  onDone,
}: {
  activity?: Activity
  date: string
  onDone: () => void
}) {
  const create = useCreateActivity()
  const update = useUpdateActivity()
  const [f, setF] = useState<ActivityFormState>(() =>
    activity ? formFromActivity(activity) : emptyForm('swim'),
  )
  const set = (patch: Partial<ActivityFormState>) =>
    setF((cur) => ({ ...cur, ...patch }))
  const valid = formValid(f)
  const pending = create.isPending || update.isPending

  function save() {
    const input = formToInput(f, activity?.date ?? date)
    if (activity) {
      const { kind: _kind, ...patch } = input
      update.mutate({ id: activity.id, patch }, { onSuccess: onDone })
    } else create.mutate(input, { onSuccess: onDone })
  }

  return (
    <div className="pop-in flex flex-col gap-4 rounded-md bg-muted p-3">
      {!activity && (
        <div className="flex flex-wrap gap-2" aria-label="Вид">
          {KINDS.map((k) => (
            <Chip
              key={k}
              active={f.kind === k}
              onClick={() => setF({ ...emptyForm(k), notes: f.notes })}
            >
              {ACTIVITY_LABEL[k]}
            </Chip>
          ))}
        </div>
      )}

      {f.kind === 'swim' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-label text-muted-foreground">Дорожка</span>
            {POOLS.map((p) => (
              <Chip
                key={p}
                active={f.poolLength === p}
                onClick={() => set({ poolLength: p })}
              >
                {p} м
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stepper
              label="Дорожка"
              unit="м"
              value={f.poolLength}
              min={10}
              decimals={false}
              onChange={(poolLength) => set({ poolLength })}
            />
            <Stepper
              label="Сколько раз"
              value={f.laps}
              min={1}
              decimals={false}
              onChange={(laps) => set({ laps })}
            />
            <Stepper
              label="Минуты"
              value={f.minutes}
              decimals={false}
              onChange={(minutes) => set({ minutes })}
            />
            <Stepper
              label="Секунды"
              value={f.seconds}
              step={5}
              decimals={false}
              onChange={(seconds) => set({ seconds: Math.min(seconds, 59) })}
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Stepper
            label="Дистанция"
            unit="км"
            value={f.km}
            step={1}
            onChange={(km) => set({ km })}
          />
          <div />
          <Stepper
            label="Часы"
            value={f.hours}
            decimals={false}
            onChange={(hours) => set({ hours })}
          />
          <Stepper
            label="Минуты"
            value={f.minutes}
            step={5}
            decimals={false}
            onChange={(minutes) => set({ minutes: Math.min(minutes, 59) })}
          />
        </div>
      )}

      <p className="font-mono text-sm text-muted-foreground">
        {valid
          ? activityStats({
              kind: f.kind,
              poolLength: f.poolLength,
              laps: f.laps,
              distanceM: formDistanceM(f),
              durationSec: formDurationSec(f),
            }).join(' · ')
          : 'Укажи дистанцию и время'}
      </p>

      <Field label="Заметка">
        <Textarea
          value={f.notes}
          maxLength={2000}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </Field>

      <div className="flex gap-2">
        <Button disabled={!valid || pending} onClick={save}>
          Сохранить
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Публичный API слайса**

`apps/web/src/features/log-activity/index.ts`:

```ts
export { ActivityForm } from './ui/activity-form'
export { useDeleteActivity } from './model/mutations'
```

- [ ] **Step 5: Проверка**

```bash
cd /Users/philip_moriss/my-app/training/apps/web && npm run typecheck && npm run lint && npm run lint:deps
```

Ожидается: без ошибок. Если `oxlint` ругается на неиспользуемую `_kind`, заменить деструктуризацию в `save` на явный объект: `const { date: d, durationSec, notes, poolLength, laps, distanceM } = input` и `patch: { date: d, durationSec, notes, poolLength, laps, distanceM }`.

- [ ] **Step 6: Commit**

```bash
cd /Users/philip_moriss/my-app/training && git add apps/web/src/features/log-activity && git commit -m "Web: activity form and optimistic mutations"
```

---

### Task 7: Блок «Доп. тренировки» на «Сегодня»

**Files:**
- Create: `apps/web/src/features/log-activity/ui/today-activities.tsx`
- Modify: `apps/web/src/features/log-activity/index.ts`
- Modify: `apps/web/src/pages/today/ui/today-page.tsx`

- [ ] **Step 1: Блок**

`apps/web/src/features/log-activity/ui/today-activities.tsx`:

```tsx
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ActivityLine, useActivities } from '@/entities/activity'
import { todayIso } from '@/shared/lib'
import { Button, Card } from '@/shared/ui'
import { useDeleteActivity } from '../model/mutations'
import { ActivityForm } from './activity-form'

/** «Сегодня»: бассейн и велик за день — дополнение к залу, не часть программы. */
export function TodayActivities() {
  const { data } = useActivities()
  const remove = useDeleteActivity().mutate
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const today = todayIso()
  const items = (data ?? []).filter((a) => a.date === today)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 pt-2">
        <h2 className="display text-2xl whitespace-nowrap">Доп. тренировки</h2>
        <span className="mono-label shrink-0 text-right text-stage-muted">
          бассейн, велик
        </span>
      </div>

      {items.map((a) => (
        <Card key={a.id} className="gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex min-w-0 flex-1 cursor-pointer"
              aria-expanded={editing === a.id}
              disabled={a.id.startsWith('temp-')}
              onClick={() => setEditing(editing === a.id ? null : a.id)}
            >
              <ActivityLine activity={a} />
            </button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Удалить доп. тренировку"
              disabled={a.id.startsWith('temp-')}
              onClick={() => remove(a.id)}
            >
              <Trash2 />
            </Button>
          </div>
          {editing === a.id && (
            <ActivityForm
              activity={a}
              date={today}
              onDone={() => setEditing(null)}
            />
          )}
        </Card>
      ))}

      {editing === 'new' ? (
        <Card>
          <ActivityForm date={today} onDone={() => setEditing(null)} />
        </Card>
      ) : (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => setEditing('new')}
        >
          <Plus />
          Доп. тренировка
        </Button>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Экспорт**

`apps/web/src/features/log-activity/index.ts` целиком:

```ts
export { ActivityForm } from './ui/activity-form'
export { TodayActivities } from './ui/today-activities'
export { useDeleteActivity } from './model/mutations'
```

- [ ] **Step 3: Подключить на «Сегодня»**

В `apps/web/src/pages/today/ui/today-page.tsx` добавить импорт:

```ts
import { TodayActivities } from '@/features/log-activity'
```

и заменить итоговый `return (<Workout ... />)` на обёртку:

```tsx
  return (
    <div className="flex flex-col gap-6">
      <Workout
        program={program.data}
        entries={journal.entries}
        banner={
          me && (
            <>
              <CoachChangesCard />
              <InstallCard dismissible />
              <LegacyImportCard
                userId={me.id}
                excelSlot={
                  <ImportXlsx
                    exercises={program.data.exercises}
                    buttonVariant="outline"
                  />
                }
              />
            </>
          )
        }
      />
      <TodayActivities />
    </div>
  )
```

- [ ] **Step 4: Проверка типов и зависимостей**

```bash
cd /Users/philip_moriss/my-app/training/apps/web && npm run typecheck && npm run lint && npm run lint:deps
```

Ожидается: без ошибок.

- [ ] **Step 5: Commit**

```bash
cd /Users/philip_moriss/my-app/training && git add apps/web/src/features/log-activity apps/web/src/pages/today && git commit -m "Today: extra workouts block for swim and bike"
```

---

### Task 8: Кардио в «Дневнике» (и у тренера)

**Files:**
- Modify: `apps/web/src/pages/journal/ui/journal-page.tsx`
- Modify: `apps/web/src/widgets/journal-list/ui/journal-list.tsx`

- [ ] **Step 1: Страница передаёт кардио**

`apps/web/src/pages/journal/ui/journal-page.tsx` целиком:

```tsx
import { useActivities } from '@/entities/activity'
import { useEntries } from '@/entities/entry'
import { useProgram } from '@/entities/program'
import { useScopedRoutes } from '@/shared/config'
import { PageState } from '@/shared/ui'
import { JournalList } from '@/widgets/journal-list'

export function JournalPage() {
  const program = useProgram()
  const journal = useEntries()
  const activities = useActivities()
  const { clientId, journalBack } = useScopedRoutes()
  if (
    (program.isError && !program.data) ||
    (journal.isError && !journal.data) ||
    (activities.isError && !activities.data)
  )
    return (
      <PageState
        error
        onRetry={() =>
          void Promise.all([
            program.refetch(),
            journal.refetch(),
            activities.refetch(),
          ])
        }
      />
    )
  if (!program.data || !journal.data || !activities.data) return <PageState />
  return (
    <JournalList
      entries={journal.entries}
      activities={activities.data}
      exercises={program.data.exercises}
      back={journalBack}
      readOnly={!!clientId}
    />
  )
}
```

- [ ] **Step 2: Список по дням с кардио**

В `apps/web/src/widgets/journal-list/ui/journal-list.tsx`:

Импорты добавить:

```ts
import { ActivityLine, type Activity } from '@/entities/activity'
import { ActivityForm, useDeleteActivity } from '@/features/log-activity'
```

Пропсы: добавить `activities` в деструктуризацию и в тип (`activities: Activity[]`), поправить комментарий над компонентом на «все записи и доп. тренировки по дням».

Заменить вычисление `groups` и добавить удаление кардио:

```ts
  const removeActivity = useDeleteActivity().mutate

  /** Дни новые сверху: записи зала и кардио одного дня — в одной карточке. */
  const groups = useMemo(() => {
    const map = new Map<string, { entries: Entry[]; activities: Activity[] }>()
    const day = (date: string) => {
      let g = map.get(date)
      if (!g) map.set(date, (g = { entries: [], activities: [] }))
      return g
    }
    for (const e of sortEntries(entries)) day(e.date).entries.push(e)
    for (const a of activities) day(a.date).activities.push(a)
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
  }, [entries, activities])

  const gymDays = groups.filter(([, g]) => g.entries.length).length
```

Стат «Тренировок»: `value={gymDays.toString()}` вместо `groups.length.toString()`.

В пустом состоянии текст для клиента: «Пока пусто. Отметь упражнения на вкладке «Сегодня» — они появятся здесь.» оставить как есть (кардио тоже записывается на «Сегодня»).

В `groups.map` поменять деструктуризацию на `([date, { entries: items, activities: cardio }])`. Шапка карточки — подпись справа только если есть записи зала:

```tsx
                <span className="mono-label shrink-0 text-muted-foreground">
                  {items.length > 0 &&
                    `${items[0].week ? `Нед. ${items[0].week} · ` : ''}${num(
                      items.reduce((s, e) => s + volume(e), 0),
                    )} кг`}
                </span>
```

`<ul>` с записями зала оставить без изменений, но рендерить только при `items.length > 0`. После него добавить:

```tsx
              {cardio.length > 0 && (
                <ul className="flex flex-col">
                  {cardio.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-col gap-3 border-t border-border py-3 first:border-t-0"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
                          aria-expanded={editing === a.id}
                          disabled={readOnly || a.id.startsWith('temp-')}
                          onClick={() =>
                            setEditing(editing === a.id ? null : a.id)
                          }
                        >
                          <ActivityLine activity={a} />
                          {!readOnly && (
                            <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Удалить доп. тренировку"
                            disabled={a.id.startsWith('temp-')}
                            onClick={() => removeActivity(a.id)}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                      {editing === a.id && (
                        <ActivityForm
                          activity={a}
                          date={a.date}
                          onDone={() => setEditing(null)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
```

Если в дне есть и зал, и кардио, второй `<ul>` получает верхнюю границу: добавить ему класс `border-t border-border` при `items.length > 0` через `cn` из `@/shared/lib` (`className={cn('flex flex-col', items.length > 0 && 'border-t border-border')}`).

- [ ] **Step 3: Проверка типов и зависимостей**

```bash
cd /Users/philip_moriss/my-app/training/apps/web && npm run typecheck && npm run lint && npm run lint:deps
```

Ожидается: без ошибок. Excel-выгрузка (`ExportButton`) получает только `entries`, её не трогаем.

- [ ] **Step 4: Commit**

```bash
cd /Users/philip_moriss/my-app/training && git add apps/web/src/pages/journal apps/web/src/widgets/journal-list && git commit -m "Journal: show swim and bike workouts by day, read-only for coach"
```

---

### Task 9: Проверка в браузере

- [ ] **Step 1: Поднять стек**

Если в `.claude/launch.json` нет конфигурации, создать по README (`docker compose -f docker-compose.dev.yml up --build`, либо `npm run start:dev` в backend и `npm run dev` в web) и открыть через `preview_start`.

- [ ] **Step 2: Клиент**

Зарегистрировать тестовый аккаунт. На «Сегодня»: «+ Доп. тренировка», «Бассейн», дорожка 25, 40 раз, 22 мин 30 с. Сводка под полями: «1 000 м · 40×25 м · 22:30 · 2:15/100 м». Сохранить, карточка появилась. Добавить «Велосипед», 32,4 км, 1 ч 12 мин: «32,4 км · 1:12:00 · 27,0 км/ч». Открыть бассейн, поменять на 60 раз, сохранить: «1 500 м». Удалить велик.

- [ ] **Step 3: Дневник**

В «Дневнике» сегодняшний день с плашкой бассейна. День только с кардио показывается, «Тренировок» его не считает. Консоль без ошибок (`read_console_messages`).

- [ ] **Step 4: Тренер**

Через админку создать тренера и клиента (как в `test/coaching.e2e-spec.ts`), клиентом записать бассейн, открыть дневник клиента в кабинете тренера: плашка видна, без карандаша и корзины. Переключиться на другого клиента: кардио первого не мелькает.

- [ ] **Step 5: Полный прогон проверок**

```bash
cd /Users/philip_moriss/my-app/training/apps/backend && npm test && npm run test:e2e && npm run lint && npm run lint:deps && npm run build
```

```bash
cd /Users/philip_moriss/my-app/training/apps/web && npm run typecheck && npm run lint && npm run lint:deps && npm run build
```

Ожидается: всё зелёное.
