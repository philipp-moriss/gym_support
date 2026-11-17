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
