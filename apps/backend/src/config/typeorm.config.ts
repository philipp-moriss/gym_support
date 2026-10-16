import { ConfigService } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';

type Env = (key: string) => string | undefined;

/**
 * Общие настройки подключения для приложения и CLI миграций.
 * Схема меняется только миграциями (synchronize выключен), при старте
 * приложения непримененные миграции накатываются автоматически.
 */
export function buildDataSourceOptions(env: Env): DataSourceOptions {
  const common = {
    type: 'postgres' as const,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false,
  };
  const url = env('DATABASE_URL');
  if (url) {
    return {
      ...common,
      url,
      // Postgres на Railway — с самоподписанным сертификатом; DATABASE_SSL=false для локального.
      ssl:
        env('DATABASE_SSL') === 'false' ? false : { rejectUnauthorized: false },
    };
  }
  return {
    ...common,
    host: env('DATABASE_HOST'),
    port: Number(env('DATABASE_PORT')),
    database: env('DATABASE_NAME'),
    username: env('DATABASE_USER'),
    password: env('DATABASE_PASSWORD'),
  };
}

export function createTypeOrmConfig(cfg: ConfigService) {
  return {
    ...buildDataSourceOptions((key) => cfg.get<string>(key)),
    migrationsRun: true,
  };
}
