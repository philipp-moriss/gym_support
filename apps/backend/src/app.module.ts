import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmConfig } from './config/typeorm.config';
import { HealthModule } from './health';
import { AccountsModule } from './accounts';
import { ProgramModule } from './program';
import { AuthModule } from './auth';
import { JournalModule } from './journal';

/** Composition root: единственное место, где модули связываются друг с другом. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: '.env.development',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmConfig,
    }),
    HealthModule,
    AccountsModule,
    ProgramModule,
    AuthModule,
    JournalModule,
  ],
})
export class AppModule {}
