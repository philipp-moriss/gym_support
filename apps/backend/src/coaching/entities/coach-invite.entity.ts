import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Код-приглашение тренера: клиент вводит его в «Профиле». Хранится только HMAC. */
@Entity('coach_invites')
export class CoachInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ForeignKey('accounts', {
    name: 'FK_coach_invites_coach',
    onDelete: 'CASCADE',
  })
  @Column('uuid')
  coachId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  codeLookup: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  usedBy: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
