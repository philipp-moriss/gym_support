import { Column, Entity, Index } from 'typeorm';
import { BaseEntity, type Role } from '../../shared';

/** Аккаунт без email: логин выдаём сами, код храним только хешем. */
@Entity('accounts')
export class Account extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  login: string;

  /** scrypt$<salt>$<hash>: код из 6 цифр с секретом сервера и солью. */
  @Column({ type: 'varchar', length: 200 })
  codeHash: string;

  /** HMAC кода для входа без логина; null — старый 6-значный код, вход только с логином. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  codeLookup: string | null;

  /** Неверные попытки подряд; сбрасывается при входе и блокировке. */
  @Column({ type: 'int', default: 0 })
  failedAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ type: 'int', default: 0 })
  sessionsVersion: number;

  /** client — тренируется сам, coach — кабинет тренера (своего журнала нет). */
  @Column({ type: 'varchar', length: 10, default: 'client' })
  role: Role;

  /** Имя для тренера и админки. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  name: string | null;

  /** Заблокирован админом. */
  @Column({ type: 'boolean', default: false })
  disabled: boolean;

  /** Анализов ИИ в день у тренера; null — AI_DAILY_LIMIT. */
  @Column({ type: 'int', nullable: true })
  aiDailyLimit: number | null;
}
