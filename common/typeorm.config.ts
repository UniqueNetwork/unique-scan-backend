import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import dotenv = require('dotenv');
import path = require('path');
import { Model } from '../apps/crawler/src/model';

dotenv.config();
const entitiesDir = path.join(__dirname, 'entities');
const migrationsDir = path.join(__dirname, '..', 'migrations');

const typeormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: +process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: [
    path.join(entitiesDir, '/**/*{.ts,.js}'),
    Model,
  ],
  synchronize: true,
  migrationsRun: false,
  migrations: [path.join(migrationsDir, '/**/*{.ts,.js}')],
  cli: {
    migrationsDir,
    entitiesDir,
  },
  logging: process.env.LOGGING === '1',
};

export default typeormConfig;
