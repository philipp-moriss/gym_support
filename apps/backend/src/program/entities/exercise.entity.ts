import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numeric } from '../../shared';
import type { Group, Muscle, Unit, WeekPlan } from '../program.types';

/**
 * Упражнение программы пользователя. id строковый и уникален в пределах
 * аккаунта: у упражнений из шаблона это ключи прежней версии («bench»),
 * поэтому старые записи дневника и черновики ссылаются на них без пересчёта.
 */
@Entity('exercises')
export class Exercise {
  @PrimaryColumn('uuid')
  @ForeignKey('accounts', { name: 'FK_exercises_account', onDelete: 'CASCADE' })
  userId: string;

  @PrimaryColumn({ type: 'varchar', length: 40 })
  id: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 60 })
  short: string;

  @Column({ type: 'varchar', length: 20 })
  muscle: Muscle;

  @Column({ type: 'varchar', length: 10 })
  group: Group;

  @Column({ type: 'varchar', length: 5 })
  unit: Unit;

  @Column({ type: 'boolean', default: false })
  perSide: boolean;

  /**
   * Рабочий вес: с ним идёт тренировка, дальше — двойная прогрессия
   * (docs/training-progression.md). null — план по неделям в weeks.
   */
  @Column({
    type: 'numeric',
    precision: 7,
    scale: 2,
    nullable: true,
    transformer: numeric,
  })
  base: number | null;

  /** Шаг веса в степпере; 0 — упражнение без веса. */
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: numeric,
  })
  step: number;

  /** Когда рабочий вес задан руками: позже последней записи — считаем от него, а не от записи. */
  @Column({ type: 'timestamptz', nullable: true })
  baseSetAt: Date | null;

  /** Подходов для упражнения с рабочим весом. */
  @Column({ type: 'smallint', default: 3 })
  targetSets: number;

  /** Диапазон повторов для двойной прогрессии. */
  @Column({ type: 'smallint', default: 12 })
  repsMin: number;

  @Column({ type: 'smallint', default: 15 })
  repsMax: number;

  /** План на 4 недели, если вес не считается от базы. */
  @Column({ type: 'jsonb', nullable: true })
  weeks: WeekPlan[] | null;

  /** id упражнения, которое это заменяет. */
  @Column({ type: 'varchar', length: 40, nullable: true })
  alternativeOf: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tips: string[];

  /** Дни недели (0 — пн), когда упражнение в тренировке; пусто — каждый день тренировки. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  days: number[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
