import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BaseEntity } from '../../shared';

/**
 * Сессия устройства: живёт, пока жив refresh-токен. В базе только хэш токена.
 * userId → accounts: FK по имени таблицы, без импорта чужой сущности.
 */
@Entity('sessions')
export class Session extends BaseEntity {
  @Index()
  @ForeignKey('accounts', { name: 'FK_sessions_account', onDelete: 'CASCADE' })
  @Column('uuid')
  userId: string;

  /** Версия сессий пользователя на момент входа (AccountRecord.sessionsVersion). */
  @Column({ type: 'int' })
  userSessionsVersion: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  userAgent: string | null;
}
