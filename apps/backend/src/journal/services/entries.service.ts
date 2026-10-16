import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateEntryDto } from '../dto/journal.dto';
import { Entry } from '../entities/entry.entity';

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

@Injectable()
export class EntriesService {
  constructor(@InjectRepository(Entry) private entries: Repository<Entry>) {}

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
      sets: dto.sets,
      reps: dto.reps,
      weight: dto.weight,
      pain: dto.pain ?? null,
      effort: dto.effort ?? null,
      notes: dto.notes?.trim() ?? '',
    };
  }
}
