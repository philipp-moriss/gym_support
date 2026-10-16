import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drafts, type Draft } from '../entities/drafts.entity';

const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Черновик из клиента: берём только известные поля в допустимых пределах. */
export function sanitizeDraft(raw: unknown): Draft | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  return {
    weight: clamp(d.weight, 0, 2000, 0),
    sets: Math.round(clamp(d.sets, 0, 100, 1)),
    reps: Math.round(clamp(d.reps, 0, 10_000, 1)),
    pain: Math.round(clamp(d.pain, 0, 10, 0)),
    effort: Math.round(clamp(d.effort, 0, 10, 5)),
    notes: typeof d.notes === 'string' ? d.notes.slice(0, 2000) : '',
    ...(Array.isArray(d.setsDone)
      ? {
          setsDone: d.setsDone
            .slice(0, 100)
            .map((r) => Math.round(clamp(r, 0, 10_000, 0))),
        }
      : {}),
  };
}

@Injectable()
export class DraftsService {
  constructor(@InjectRepository(Drafts) private drafts: Repository<Drafts>) {}

  async get(userId: string) {
    const row = await this.drafts.findOneBy({ userId });
    return row
      ? { date: row.date, items: row.items }
      : { date: null, items: {} };
  }

  async put(userId: string, date: string, items: Record<string, unknown>) {
    const clean: Record<string, Draft> = {};
    for (const [id, raw] of Object.entries(items).slice(0, 200)) {
      const draft = sanitizeDraft(raw);
      if (draft && id.length <= 40) clean[id] = draft;
    }
    await this.drafts.save({ userId, date, items: clean });
    return { date, items: clean };
  }

  async clear(userId: string) {
    await this.drafts.delete({ userId });
  }
}
