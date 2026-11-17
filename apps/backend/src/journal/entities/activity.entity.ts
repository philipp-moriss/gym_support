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
