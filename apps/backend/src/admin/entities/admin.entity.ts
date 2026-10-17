import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared';

/** Админ: отдельно от аккаунтов, вход логином и паролем. */
@Entity('admins')
export class Admin extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  login: string;

  /** scrypt$<salt>$<hash> с секретом сервера. */
  @Column({ type: 'varchar', length: 200 })
  passwordHash: string;

  @Column({ type: 'int', default: 0 })
  failedAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  /** Растёт при смене пароля: выданные токены перестают работать. */
  @Column({ type: 'int', default: 0 })
  sessionsVersion: number;
}
