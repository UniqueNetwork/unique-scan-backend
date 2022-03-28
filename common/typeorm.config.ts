import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import dotenv = require('dotenv');
import path = require('path');

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
  entities: [path.join(entitiesDir, '/**/*{.ts,.js}')],
  synchronize: false,
  migrationsRun: false,
  migrations: [path.join(migrationsDir, '/**/*{.ts,.js}')],
  cli: {
    migrationsDir,
    entitiesDir,
  },
  logging: true,
};

export default typeormConfig;
