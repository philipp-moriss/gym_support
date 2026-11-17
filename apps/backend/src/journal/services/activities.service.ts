import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateActivityDto, UpdateActivityDto } from '../dto/journal.dto';
import { Activity, type ActivityKind } from '../entities/activity.entity';

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
