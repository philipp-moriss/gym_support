import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Клиент у тренера. Отвязка не удаляет строку, а закрывает её (`unlinkedAt`):
 * история остаётся. Активная связь у клиента одна (частичный уникальный индекс).
 */
@Entity('coach_clients')
@Index('UQ_coach_clients_active_client', ['clientId'], {
  unique: true,
  where: '"unlinkedAt" IS NULL',
})
@Index(['coachId'])
export class CoachClient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey('accounts', {
    name: 'FK_coach_clients_coach',
    onDelete: 'CASCADE',
  })
  @Column('uuid')
  coachId: string;

  @ForeignKey('accounts', {
    name: 'FK_coach_clients_client',
    onDelete: 'CASCADE',
  })
  @Column('uuid')
  clientId: string;

  /** Как тренер называет клиента у себя. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  alias: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  unlinkedAt: Date | null;
}
