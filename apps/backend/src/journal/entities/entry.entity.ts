import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BaseEntity, numeric } from '../../shared';

/** Запись дневника: одно упражнение в один день. */
@Entity('entries')
@Index(['userId', 'date'])
export class Entry extends BaseEntity {
  @ForeignKey('accounts', { name: 'FK_entries_account', onDelete: 'CASCADE' })
  @Column('uuid')
  userId: string;

  /** YYYY-MM-DD по часам пользователя. */
  @Column({ type: 'date' })
  date: string;

  /** Неделя программы на момент записи. */
  @Column({ type: 'int', nullable: true })
  week: number | null;

  /** id упражнения программы; null — упражнение не найдено в программе (импорт). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  exerciseId: string | null;

  /** Название на момент записи: переживает удаление упражнения. */
  @Column({ type: 'varchar', length: 160 })
  exercise: string;

  @Column({ type: 'int' })
  sets: number;

  /** Повторы, секунды или минуты — смотря что у упражнения. */
  @Column({ type: 'int' })
  reps: number;

  /** кг, 0 — без веса. */
  @Column({
    type: 'numeric',
    precision: 7,
    scale: 2,
    default: 0,
    transformer: numeric,
  })
  weight: number;

  /** Повторы по подходам, если отмечали каждый подход: [12, 12, 10]. sets и reps тогда — их число и среднее. */
  @Column({ type: 'jsonb', nullable: true })
  setReps: number[] | null;

  /** Боль в спине 0–10. */
  @Column({ type: 'smallint', nullable: true })
  pain: number | null;

  /** Сложность 0–10. */
  @Column({ type: 'smallint', nullable: true })
  effort: number | null;

  @Column({ type: 'text', default: '' })
  notes: string;
}
