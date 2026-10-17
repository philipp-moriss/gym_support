import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts';
import { AiModule } from '../ai';
import { CoachingModule } from '../coaching';
import { JournalModule } from '../journal';
import {
  AdminAuthController,
  AdminController,
} from './controllers/admin.controller';
import { Admin } from './entities/admin.entity';
import { AdminGuard } from './guards/admin.guard';
import { AdminPanelService } from './services/admin-panel.service';
import { AdminsService } from './services/admins.service';

/** Админка (`apps/admin`): тренеры, клиенты и привязки, промпты ИИ, статистика. */
@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
    AccountsModule,
    CoachingModule,
    JournalModule,
    AiModule,
  ],
  controllers: [AdminAuthController, AdminController],
  providers: [AdminsService, AdminPanelService, AdminGuard],
})
export class AdminModule {}
