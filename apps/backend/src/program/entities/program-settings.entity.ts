import {
  Column,
  Entity,
  ForeignKey,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { DayPlan } from '../program.types';

/** Цикл, расписание и правила пользователя: одна строка на аккаунт. */
@Entity('program_settings')
export class ProgramSettings {
  @PrimaryColumn('uuid')
  @ForeignKey('accounts', {
    name: 'FK_program_settings_account',
    onDelete: 'CASCADE',
  })
  userId: string;

  /** Понедельник первой недели цикла, YYYY-MM-DD. */
  @Column({ type: 'date' })
  startDate: string;

  /** Упражнение заменено альтернативой: bridge → bridge1. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  swaps: Record<string, string>;

  /** С этой даты записи снова влияют на подстройку весов. */
  @Column({ type: 'date', nullable: true })
  resetAt: string | null;

  /** 7 дней, 0 — понедельник. */
  @Column({ type: 'jsonb' })
  schedule: DayPlan[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  rules: string[];

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
