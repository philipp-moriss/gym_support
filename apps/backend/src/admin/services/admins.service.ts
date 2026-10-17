import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { hashPassword, verifyPassword } from './password';

export const ADMIN_AUDIENCE = 'admin';
export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export interface AdminTokenPayload {
  sub: string;
  ver: number;
  aud: typeof ADMIN_AUDIENCE;
}

const view = ({ id, login, createdAt }: Admin) => ({ id, login, createdAt });

const normalize = (login: string) => login.trim().toLowerCase();

/**
 * Админы: вход логином и паролем с лимитом попыток, свой токен (`aud: admin`)
 * на 12 часов без refresh. Первый админ создаётся при старте из
 * ADMIN_LOGIN / ADMIN_PASSWORD, если админов ещё нет.
 */
@Injectable()
export class AdminsService implements OnModuleInit {
  private readonly logger = new Logger(AdminsService.name);
  private readonly pepper: string;

  constructor(
    @InjectRepository(Admin) private admins: Repository<Admin>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    this.pepper = config.getOrThrow<string>('CODE_PEPPER');
  }

  async onModuleInit() {
    const login = this.config.get<string>('ADMIN_LOGIN');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!login || !password || (await this.admins.count())) return;
    await this.create(login, password);
    this.logger.log(`First admin "${normalize(login)}" created from env`);
  }

  async create(login: string, password: string) {
    if (await this.admins.existsBy({ login: normalize(login) }))
      throw new ConflictException('Login is taken');
    const admin = await this.admins.save(
      this.admins.create({
        login: normalize(login),
        passwordHash: await hashPassword(password, this.pepper),
      }),
    );
    return view(admin);
  }

  async list() {
    return (await this.admins.find({ order: { createdAt: 'ASC' } })).map(view);
  }

  async login(login: string, password: string) {
    const admin = await this.admins.findOneBy({ login: normalize(login) });
    if (!admin) {
      // Время ответа как при неверном пароле: не подсказываем, есть ли логин.
      await hashPassword(password, this.pepper);
      throw new UnauthorizedException('Invalid login or password');
    }
    const now = Date.now();
    if (admin.lockedUntil && admin.lockedUntil.getTime() > now)
      throw tooMany(admin.lockedUntil);

    if (await verifyPassword(password, this.pepper, admin.passwordHash)) {
      if (admin.failedAttempts || admin.lockedUntil)
        await this.admins.update(admin.id, {
          failedAttempts: 0,
          lockedUntil: null,
        });
      const payload: AdminTokenPayload = {
        sub: admin.id,
        ver: admin.sessionsVersion,
        aud: ADMIN_AUDIENCE,
      };
      return {
        accessToken: await this.jwt.signAsync(payload, {
          expiresIn: 12 * 3600,
        }),
        admin: view(admin),
      };
    }

    const rows: unknown = await this.admins.query(
      `UPDATE admins SET "failedAttempts" = "failedAttempts" + 1 WHERE id = $1 RETURNING "failedAttempts"`,
      [admin.id],
    );
    const failed = (rows as [[{ failedAttempts: number }], number])[0][0]
      .failedAttempts;
    if (failed >= MAX_ATTEMPTS) {
      const lockedUntil = new Date(now + LOCK_MINUTES * 60_000);
      await this.admins.update(admin.id, { failedAttempts: 0, lockedUntil });
      throw tooMany(lockedUntil);
    }
    throw new UnauthorizedException('Invalid login or password');
  }

  /** Проверка токена для guard'а: админ существует и версия сессий совпадает. */
  async verify(token: string) {
    const payload = await this.jwt
      .verifyAsync<AdminTokenPayload>(token, { audience: ADMIN_AUDIENCE })
      .catch(() => null);
    if (!payload) return null;
    const admin = await this.admins.findOneBy({ id: payload.sub });
    return admin && admin.sessionsVersion === payload.ver ? view(admin) : null;
  }
}

const tooMany = (until: Date) =>
  new HttpException(
    {
      statusCode: 429,
      message: 'Too many attempts',
      retryAfterSec: Math.max(
        1,
        Math.ceil((until.getTime() - Date.now()) / 1000),
      ),
    },
    HttpStatus.TOO_MANY_REQUESTS,
  );
