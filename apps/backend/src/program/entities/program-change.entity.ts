import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Правка программы чужими руками (тренер, ИИ по решению тренера): что было,
 * что стало и почему. Клиент видит непросмотренные на «Сегодня».
 */
@Entity('program_changes')
@Index(['userId', 'createdAt'])
export class ProgramChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey('accounts', {
    name: 'FK_program_changes_account',
    onDelete: 'CASCADE',
  })
  @Column('uuid')
  userId: string;

  /** Кто менял. Тренер может быть уже удалён — без внешнего ключа. */
  @Column('uuid')
  actorId: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  exerciseId: string | null;

  /** Название упражнения на момент правки. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  exercise: string | null;

  /** base, step, weeks, days, added, removed, schedule, rules, startDate… */
  @Column({ type: 'varchar', length: 20 })
  field: string;

  @Column({ type: 'text', nullable: true })
  before: string | null;

  @Column({ type: 'text', nullable: true })
  after: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 10, default: 'manual' })
  source: 'manual' | 'ai';

  @Column({ type: 'timestamptz', nullable: true })
  seenAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
