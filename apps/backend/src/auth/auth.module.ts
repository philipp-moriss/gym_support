import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts';
import { CoachingModule } from '../coaching';
import { ProgramModule } from '../program';
import { Session } from './entities/session.entity';
import { SessionsService } from './services/sessions.service';
import { AuthService } from './services/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthController } from './controllers/auth.controller';

/**
 * Регистрация, вход по коду, сессии. Guard подключён глобально (APP_GUARD):
 * доступ закрыт по умолчанию, открытые эндпоинты помечаются `@Public()`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(config.get('ACCESS_TOKEN_TTL_SECONDS', 900)),
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: 60_000,
          limit: Number(config.get('AUTH_RATE_LIMIT_PER_MINUTE', 10)),
        },
        // Вход одним кодом можно подбирать по всем аккаунтам сразу — дневной потолок на IP.
        {
          name: 'daily',
          ttl: 24 * 60 * 60_000,
          limit: Number(config.get('AUTH_RATE_LIMIT_PER_DAY', 100)),
        },
      ],
    }),
    AccountsModule,
    ProgramModule,
    CoachingModule,
  ],
  controllers: [AuthController],
  providers: [
    SessionsService,
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
