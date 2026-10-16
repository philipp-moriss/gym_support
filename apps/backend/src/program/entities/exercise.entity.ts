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

  /** Последний рабочий вес — от него считаются недели. null — план по неделям в weeks. */
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
