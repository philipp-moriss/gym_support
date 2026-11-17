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
