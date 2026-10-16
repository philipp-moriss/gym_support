import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared';

/** Аккаунт без email и имени: логин выдаём сами, код храним только хешем. */
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
}
