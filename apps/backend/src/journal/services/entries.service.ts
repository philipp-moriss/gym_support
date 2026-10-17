import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import type { JournalReader, JournalStats } from '../../shared';
import type { CreateEntryDto, UpdateEntryDto } from '../dto/journal.dto';
import { Entry } from '../entities/entry.entity';

/**
 * Отмечали каждый подход — число подходов и средние повторы считаем из них,
 * чтобы sets × reps × вес оставались осмысленными для итогов и экспорта.
 */
function setsAndReps(dto: Pick<CreateEntryDto, 'sets' | 'reps' | 'setReps'>) {
  const setReps = dto.setReps?.length ? dto.setReps : null;
  if (!setReps) return { sets: dto.sets, reps: dto.reps, setReps: null };
  const total = setReps.reduce((s, r) => s + r, 0);
  return {
    sets: setReps.length,
    reps: Math.round(total / setReps.length),
    setReps,
  };
}

const view = ({ userId: _userId, updatedAt: _u, ...rest }: Entry) => rest;

/** Ключ дубля: одинаковая запись за тот же день при повторном импорте не добавляется. */
const dedupeKey = (
  e: Pick<Entry, 'date' | 'exercise' | 'sets' | 'reps' | 'weight' | 'notes'>,
) =>
  [
    e.date,
    e.exercise.trim().toLowerCase(),
    e.sets,
    e.reps,
    Number(e.weight),
    (e.notes ?? '').trim(),
  ].join('|');

/** День `days` дней назад от `today` (YYYY-MM-DD). */
const daysBefore = (today: string, days: number) => {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};

@Injectable()
export class EntriesService implements JournalReader {
  constructor(@InjectRepository(Entry) private entries: Repository<Entry>) {}

  async history(userId: string, since?: string) {
    const rows = await this.entries.find({
      where: { userId, ...(since && { date: MoreThanOrEqual(since) }) },
      order: { date: 'ASC', createdAt: 'ASC' },
    });
    return rows.map(view);
  }

  async stats(userIds: string[], today: string): Promise<JournalStats[]> {
    if (!userIds.length) return [];
    const rows: {
      userId: string;
      lastWorkout: string | null;
      workouts7d: string;
      maxPain14d: number | null;
    }[] = await this.entries
      .createQueryBuilder('e')
      .select('e.userId', 'userId')
      .addSelect(`to_char(MAX(e.date), 'YYYY-MM-DD')`, 'lastWorkout')
      .addSelect(
        'COUNT(DISTINCT e.date) FILTER (WHERE e.date > :d7)',
        'workouts7d',
      )
      .addSelect('MAX(e.pain) FILTER (WHERE e.date > :d14)', 'maxPain14d')
      .where('e.userId IN (:...userIds)', { userIds })
      .setParameters({ d7: daysBefore(today, 7), d14: daysBefore(today, 14) })
      .groupBy('e.userId')
      .getRawMany();
    const byUser = new Map(rows.map((r) => [r.userId, r]));
    return userIds.map((userId) => {
      const r = byUser.get(userId);
      return {
        userId,
        lastWorkout: r?.lastWorkout ?? null,
        workouts7d: Number(r?.workouts7d ?? 0),
        maxPain14d: r?.maxPain14d ?? null,
      };
    });
  }

  async list(userId: string) {
    const rows = await this.entries.find({
      where: { userId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return rows.map(view);
  }

  async create(userId: string, dto: CreateEntryDto) {
    return view(
      await this.entries.save(this.entries.create(this.toRow(userId, dto))),
    );
  }

  /** Правка записи: исправить вес, повторы, отметки, заметку. */
  async update(userId: string, id: string, dto: UpdateEntryDto) {
    const entry = await this.entries.findOneBy({ userId, id });
    if (!entry) throw new NotFoundException();
    const merged = { ...entry, ...dto };
    const next = this.toRow(userId, {
      ...merged,
      // Новые подходы перекрывают старые; явный null — убрать разбивку.
      setReps: dto.setReps !== undefined ? dto.setReps : entry.setReps,
    });
    return view(await this.entries.save({ ...entry, ...next }));
  }

  async remove(userId: string, id: string) {
    const { affected } = await this.entries.delete({ userId, id });
    if (!affected) throw new NotFoundException();
  }

  async removeAll(userId: string) {
    await this.entries.delete({ userId });
  }

  /** Пакетная загрузка (Excel, старая версия). Дубли уже записанного пропускаются. */
  async import(userId: string, items: CreateEntryDto[]) {
    const existing = await this.entries.find({
      where: { userId },
      select: {
        date: true,
        exercise: true,
        sets: true,
        reps: true,
        weight: true,
        notes: true,
      },
    });
    const seen = new Set(existing.map(dedupeKey));
    const fresh: Entry[] = [];
    for (const item of items) {
      const row = this.entries.create(this.toRow(userId, item));
      const key = dedupeKey(row);
      if (seen.has(key)) continue;
      seen.add(key);
      fresh.push(row);
    }
    // Порядок внутри дня сохраняем: раньше в файле — раньше создана.
    const base = Date.now() - fresh.length;
    fresh.forEach((row, i) => (row.createdAt = new Date(base + i)));
    for (let i = 0; i < fresh.length; i += 500)
      await this.entries.insert(fresh.slice(i, i + 500));
    return { added: fresh.length, skipped: items.length - fresh.length };
  }

  private toRow(userId: string, dto: CreateEntryDto): Partial<Entry> {
    return {
      userId,
      date: dto.date,
      week: dto.week ?? null,
      exerciseId: dto.exerciseId || null,
      exercise: dto.exercise.trim(),
      ...setsAndReps(dto),
      weight: dto.weight,
      pain: dto.pain ?? null,
      effort: dto.effort ?? null,
      notes: dto.notes?.trim() ?? '',
    };
  }
}
