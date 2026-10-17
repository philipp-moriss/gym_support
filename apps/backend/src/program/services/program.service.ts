import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import type {
  ExerciseChange,
  ProgramAccess,
  ProgramActor,
  ProgramSeeder,
  ProgramTemplate,
} from '../../shared';
import type {
  CreateExerciseDto,
  UpdateExerciseDto,
  UpdateSettingsDto,
} from '../dto/program.dto';
import { Exercise } from '../entities/exercise.entity';
import { ProgramChange } from '../entities/program-change.entity';
import { ProgramSettings } from '../entities/program-settings.entity';
import { templates } from '../templates';
import {
  diffExercise,
  diffSettings,
  formatWeeks,
  type FieldChange,
} from './changes';

/** Понедельник текущей недели по UTC: дальше клиент сдвигает старт сам. */
const thisMonday = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

const view = ({
  userId: _userId,
  createdAt: _c,
  updatedAt: _u,
  ...rest
}: Exercise) => rest;
const changeView = ({ userId: _userId, ...rest }: ProgramChange) => rest;
const settingsView = ({
  userId: _userId,
  updatedAt: _u,
  ...rest
}: ProgramSettings) => rest;

/** Правки пишутся в журнал, только когда программу меняет не владелец. */
const foreign = (userId: string, actor?: ProgramActor): actor is ProgramActor =>
  !!actor && actor.id !== userId;

/**
 * Программа пользователя: упражнения, цикл, расписание и правила. Методы
 * изменения принимают `actor` — кто меняет, если не сам владелец (тренер):
 * тогда разница до/после попадает в журнал правок `program_changes`.
 */
@Injectable()
export class ProgramService implements ProgramSeeder, ProgramAccess {
  constructor(
    @InjectRepository(Exercise) private exercises: Repository<Exercise>,
    @InjectRepository(ProgramSettings)
    private settings: Repository<ProgramSettings>,
    @InjectRepository(ProgramChange)
    private changes: Repository<ProgramChange>,
    @InjectDataSource() private db: DataSource,
  ) {}

  async seed(userId: string, template: ProgramTemplate) {
    if (await this.settings.existsBy({ userId })) return;
    const t = templates[template];
    await this.db.transaction(async (m) => {
      await m.insert(ProgramSettings, {
        userId,
        startDate: thisMonday(),
        swaps: {},
        resetAt: null,
        schedule: t.schedule,
        rules: t.rules,
      });
      if (t.exercises.length) {
        await m.insert(
          Exercise,
          t.exercises.map((e, position) => ({
            ...e,
            userId,
            position,
            perSide: e.perSide ?? false,
            base: e.base ?? null,
            weeks: e.weeks ?? null,
            alternativeOf: e.alternativeOf ?? null,
            days: [],
          })),
        );
      }
    });
  }

  async get(userId: string) {
    const [exercises, settings] = await Promise.all([
      this.exercises.find({
        where: { userId },
        order: { position: 'ASC', createdAt: 'ASC' },
      }),
      this.getSettings(userId),
    ]);
    return { exercises: exercises.map(view), settings: settingsView(settings) };
  }

  async updateSettings(
    userId: string,
    dto: UpdateSettingsDto,
    actor?: ProgramActor,
  ) {
    const current = await this.getSettings(userId);
    await this.settings.save({ ...current, ...dto });
    const next = await this.getSettings(userId);
    if (foreign(userId, actor))
      await this.log(
        this.db.manager,
        userId,
        actor,
        null,
        diffSettings(current, next),
      );
    return settingsView(next);
  }

  async createExercise(
    userId: string,
    dto: CreateExerciseDto,
    actor?: ProgramActor,
  ) {
    this.assertPlan(dto);
    const max: { max: number | null } | undefined = await this.exercises
      .createQueryBuilder('e')
      .select('MAX(e.position)', 'max')
      .where('e.userId = :userId', { userId })
      .getRawOne();
    const normalized = this.normalize(dto);
    const exercise = this.exercises.create({
      ...normalized,
      baseSetAt: normalized.base !== null ? new Date() : null,
      userId,
      id: `c-${randomBytes(6).toString('base64url')}`,
      position: (max?.max ?? -1) + 1,
    });
    const saved = await this.exercises.save(exercise);
    if (foreign(userId, actor))
      await this.log(this.db.manager, userId, actor, saved, [
        { field: 'added', before: null, after: describe(saved) },
      ]);
    return view(saved);
  }

  async updateExercise(
    userId: string,
    id: string,
    dto: UpdateExerciseDto,
    actor?: ProgramActor,
  ) {
    const exercise = await this.findExercise(userId, id);
    const next = { ...exercise, ...this.normalize({ ...exercise, ...dto }) };
    this.assertPlan(next);
    // Рабочий вес задали руками — он точка отсчёта, а не прошлая запись.
    if (next.base !== null && next.base !== exercise.base)
      next.baseSetAt = new Date();
    const saved = await this.exercises.save({ ...next });
    if (foreign(userId, actor))
      await this.log(
        this.db.manager,
        userId,
        actor,
        saved,
        diffExercise(exercise, saved),
      );
    return view(saved);
  }

  async deleteExercise(userId: string, id: string, actor?: ProgramActor) {
    const exercise = await this.findExercise(userId, id);
    await this.db.transaction(async (m) => {
      await m.delete(Exercise, { userId, id });
      // Альтернатива удалённого упражнения становится самостоятельной.
      await m.update(
        Exercise,
        { userId, alternativeOf: id },
        { alternativeOf: null },
      );
    });
    const settings = await this.getSettings(userId);
    const swaps = Object.fromEntries(
      Object.entries(settings.swaps).filter(([k, v]) => k !== id && v !== id),
    );
    if (Object.keys(swaps).length !== Object.keys(settings.swaps).length) {
      await this.settings.update({ userId }, { swaps });
    }
    if (foreign(userId, actor))
      await this.log(this.db.manager, userId, actor, exercise, [
        { field: 'removed', before: describe(exercise), after: null },
      ]);
  }

  async reorder(userId: string, ids: string[]) {
    await this.db.transaction(async (m) => {
      for (const [position, id] of ids.entries())
        await m.update(Exercise, { userId, id }, { position });
    });
    return this.get(userId);
  }

  /** Новые «последние веса» разом: после цикла и при переносе из старой версии. */
  async setBases(
    userId: string,
    bases: Record<string, number>,
    actor?: ProgramActor,
  ) {
    await this.db.transaction(async (m) => {
      for (const [id, base] of Object.entries(bases)) {
        if (
          typeof base !== 'number' ||
          !Number.isFinite(base) ||
          base < 0 ||
          base > 1000
        ) {
          throw new BadRequestException(`Invalid base for ${id}`);
        }
        const before = foreign(userId, actor)
          ? await m.findOneBy(Exercise, { userId, id })
          : null;
        await m
          .createQueryBuilder()
          .update(Exercise)
          .set({ base, baseSetAt: new Date() })
          .where('"userId" = :userId AND id = :id AND base IS NOT NULL', {
            userId,
            id,
          })
          .execute();
        if (before && before.base !== null && foreign(userId, actor))
          await this.log(
            m,
            userId,
            actor,
            before,
            diffExercise(before, { ...before, base }),
          );
      }
    });
    return this.get(userId);
  }

  /** Правки ИИ, выбранные тренером: всё в одной транзакции или ничего. */
  async applyExerciseChanges(
    userId: string,
    changes: ExerciseChange[],
    actor: ProgramActor,
  ) {
    await this.db.transaction(async (m) => {
      for (const change of changes) {
        const exercise = await m.findOneBy(Exercise, {
          userId,
          id: change.exerciseId,
        });
        const bad = (why: string) =>
          new BadRequestException(`${change.exerciseId}: ${why}`);
        if (!exercise) throw bad('exercise not found');
        if (change.base !== undefined && exercise.base === null)
          throw bad('exercise has no base weight');
        if (change.weeks !== undefined && exercise.weeks === null)
          throw bad('exercise has no weekly plan');
        const scheme = ['targetSets', 'repsMin', 'repsMax'] as const;
        if (
          exercise.base === null &&
          scheme.some((k) => change[k] !== undefined)
        )
          throw bad('sets and rep range are for exercises with base weight');
        if (
          change.base === undefined &&
          change.step === undefined &&
          change.weeks === undefined &&
          scheme.every((k) => change[k] === undefined)
        )
          throw bad('nothing to change');
        const next: Exercise = {
          ...exercise,
          ...(change.base !== undefined && {
            base: change.base,
            baseSetAt: new Date(),
          }),
          ...(change.step !== undefined && { step: change.step }),
          ...(change.weeks !== undefined && { weeks: change.weeks }),
          ...(change.targetSets !== undefined && {
            targetSets: change.targetSets,
          }),
          ...(change.repsMin !== undefined && { repsMin: change.repsMin }),
          ...(change.repsMax !== undefined && { repsMax: change.repsMax }),
        };
        if (next.repsMax < next.repsMin) throw bad('repsMax below repsMin');
        await m.save(Exercise, next);
        await this.log(
          m,
          userId,
          { ...actor, reason: change.reason },
          exercise,
          diffExercise(exercise, next),
        );
      }
    });
    return this.get(userId);
  }

  async listChanges(userId: string, limit = 100) {
    const rows = await this.changes.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map(changeView);
  }

  async unseenChanges(userId: string) {
    const rows = await this.changes.find({
      where: { userId, seenAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return rows.map(changeView);
  }

  async markChangesSeen(userId: string) {
    await this.changes.update(
      { userId, seenAt: IsNull() },
      { seenAt: new Date() },
    );
  }

  private async log(
    m: EntityManager,
    userId: string,
    actor: ProgramActor,
    exercise: Pick<Exercise, 'id' | 'name'> | null,
    fields: FieldChange[],
  ) {
    if (!fields.length) return;
    await m.insert(
      ProgramChange,
      fields.map((f) => ({
        ...f,
        userId,
        actorId: actor.id,
        source: actor.source,
        reason: actor.reason?.trim() || null,
        exerciseId: exercise?.id ?? null,
        exercise: exercise?.name ?? null,
      })),
    );
  }

  private async getSettings(userId: string) {
    const settings = await this.settings.findOneBy({ userId });
    if (settings) return settings;
    // Аккаунт без программы (сбой при регистрации): создаём пустую.
    await this.seed(userId, 'empty');
    return this.settings.findOneByOrFail({ userId });
  }

  private async findExercise(userId: string, id: string) {
    const exercise = await this.exercises.findOneBy({ userId, id });
    if (!exercise) throw new NotFoundException();
    return exercise;
  }

  private normalize(dto: CreateExerciseDto) {
    return {
      ...dto,
      short: dto.short?.trim() || dto.name.trim().slice(0, 60),
      name: dto.name.trim(),
      perSide: dto.perSide ?? false,
      base: dto.base ?? null,
      weeks: dto.weeks ?? null,
      targetSets: dto.targetSets ?? 3,
      repsMin: dto.repsMin ?? 12,
      repsMax: dto.repsMax ?? 15,
      alternativeOf: dto.alternativeOf || null,
      tips: (dto.tips ?? []).map((t) => t.trim()).filter(Boolean),
      days: [...new Set(dto.days ?? [])].sort(),
    };
  }

  /** Упражнение считается либо от рабочего веса (двойная прогрессия), либо по плану на 4 недели. */
  private assertPlan(
    dto: Pick<CreateExerciseDto, 'base' | 'weeks' | 'repsMin' | 'repsMax'>,
  ) {
    const hasBase = dto.base !== null && dto.base !== undefined;
    if (hasBase === !!dto.weeks) {
      throw new BadRequestException('Exercise needs either base or weeks');
    }
    if ((dto.repsMax ?? 15) < (dto.repsMin ?? 12))
      throw new BadRequestException('repsMax below repsMin');
  }
}

/** Упражнение одной строкой для журнала правок: «40 кг · 3×12–15» или план по неделям. */
const describe = (
  e: Pick<Exercise, 'base' | 'weeks' | 'targetSets' | 'repsMin' | 'repsMax'>,
) =>
  e.base !== null
    ? `${Number(e.base)} кг · ${e.targetSets}×${e.repsMin}–${e.repsMax}`
    : formatWeeks(e.weeks);
