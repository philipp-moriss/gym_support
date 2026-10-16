import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.config';

/** DataSource для CLI TypeORM (генерация и запуск миграций). */
export default new DataSource(
  buildDataSourceOptions((key) => process.env[key]),
);
