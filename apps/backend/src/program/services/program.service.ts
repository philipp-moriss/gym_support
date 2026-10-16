import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import type { ProgramSeeder, ProgramTemplate } from '../../shared';
import type {
  CreateExerciseDto,
  UpdateExerciseDto,
  UpdateSettingsDto,
} from '../dto/program.dto';
import { Exercise } from '../entities/exercise.entity';
import { ProgramSettings } from '../entities/program-settings.entity';
import { templates } from '../templates';

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
const settingsView = ({
  userId: _userId,
  updatedAt: _u,
  ...rest
}: ProgramSettings) => rest;

/** Программа пользователя: упражнения, цикл, расписание и правила. */
@Injectable()
export class ProgramService implements ProgramSeeder {
  constructor(
    @InjectRepository(Exercise) private exercises: Repository<Exercise>,
    @InjectRepository(ProgramSettings)
    private settings: Repository<ProgramSettings>,
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

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const current = await this.getSettings(userId);
    await this.settings.save({ ...current, ...dto });
    return settingsView(await this.getSettings(userId));
  }

  async createExercise(userId: string, dto: CreateExerciseDto) {
    this.assertPlan(dto);
    const max: { max: number | null } | undefined = await this.exercises
      .createQueryBuilder('e')
      .select('MAX(e.position)', 'max')
      .where('e.userId = :userId', { userId })
      .getRawOne();
    const exercise = this.exercises.create({
      ...this.normalize(dto),
      userId,
      id: `c-${randomBytes(6).toString('base64url')}`,
      position: (max?.max ?? -1) + 1,
    });
    return view(await this.exercises.save(exercise));
  }

  async updateExercise(userId: string, id: string, dto: UpdateExerciseDto) {
    const exercise = await this.findExercise(userId, id);
    const next = { ...exercise, ...this.normalize({ ...exercise, ...dto }) };
    this.assertPlan(next);
    return view(await this.exercises.save(next));
  }

  async deleteExercise(userId: string, id: string) {
    await this.findExercise(userId, id);
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
  }

  async reorder(userId: string, ids: string[]) {
    await this.db.transaction(async (m) => {
      for (const [position, id] of ids.entries())
        await m.update(Exercise, { userId, id }, { position });
    });
    return this.get(userId);
  }

  /** Новые «последние веса» разом: после цикла и при переносе из старой версии. */
  async setBases(userId: string, bases: Record<string, number>) {
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
        await m
          .createQueryBuilder()
          .update(Exercise)
          .set({ base })
          .where('"userId" = :userId AND id = :id AND base IS NOT NULL', {
            userId,
            id,
          })
          .execute();
      }
    });
    return this.get(userId);
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
      alternativeOf: dto.alternativeOf || null,
      tips: (dto.tips ?? []).map((t) => t.trim()).filter(Boolean),
      days: [...new Set(dto.days ?? [])].sort(),
    };
  }

  /** Упражнение считается либо от последнего веса, либо по плану на 4 недели. */
  private assertPlan(dto: Pick<CreateExerciseDto, 'base' | 'weeks'>) {
    const hasBase = dto.base !== null && dto.base !== undefined;
    if (hasBase === !!dto.weeks) {
      throw new BadRequestException('Exercise needs either base or weeks');
    }
  }
}
