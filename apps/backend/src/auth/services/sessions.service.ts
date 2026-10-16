import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { Session } from '../entities/session.entity';

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

/** Refresh-токены: выдача, ротация, отзыв. */
@Injectable()
export class SessionsService {
  private readonly ttlMs: number;

  constructor(
    @InjectRepository(Session) private sessions: Repository<Session>,
    config: ConfigService,
  ) {
    this.ttlMs =
      Number(config.get('REFRESH_TOKEN_TTL_DAYS', 60)) * 24 * 60 * 60 * 1000;
  }

  async create(
    userId: string,
    userSessionsVersion: number,
    userAgent?: string,
  ) {
    const refreshToken = randomBytes(32).toString('base64url');
    await this.sessions.save(
      this.sessions.create({
        userId,
        userSessionsVersion,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.ttlMs),
        userAgent: userAgent?.slice(0, 300) ?? null,
      }),
    );
    return refreshToken;
  }

  /**
   * Токен одноразовый: при обмене сессия закрывается. Повторное использование
   * уже закрытого токена похоже на кражу — закрываем все сессии пользователя.
   */
  async consume(refreshToken: string): Promise<Session> {
    const session = await this.sessions.findOneBy({
      tokenHash: hashToken(refreshToken),
    });
    if (!session) throw new UnauthorizedException();
    if (session.revokedAt) {
      await this.revokeAll(session.userId);
      throw new UnauthorizedException();
    }
    session.revokedAt = new Date();
    await this.sessions.save(session);
    if (session.expiresAt.getTime() <= Date.now())
      throw new UnauthorizedException();
    return session;
  }

  async revoke(refreshToken: string) {
    await this.sessions.update(
      { tokenHash: hashToken(refreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async revokeAll(userId: string) {
    await this.sessions.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
