import { Account } from './entities/Account';
import { Block } from './entities/Block';
import { Chain } from './entities/Chain';
import { Collections } from './entities/Collections';
import { CollectionsStats } from './entities/CollectionsStats';
import { Event } from './entities/Event';
import { Extrinsic } from './entities/Extrinsic';
import { HarvesterError } from './entities/HarvesterError';
import { System } from './entities/System';
import { Tokens } from './entities/Tokens';
import { Total } from './entities/Total';
import { TokensStats } from './entities/TokensStats';
import { DataSourceOptions } from 'typeorm';
import dotenv = require('dotenv');
import path = require('path');

dotenv.config();
const migrationsDir = path.join(__dirname, '..', 'migrations');

const typeormConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: +process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: [
    Account,
    Block,
    Chain,
    Collections,
    CollectionsStats,
    Event,
    Extrinsic,
    HarvesterError,
    System,
    TokensStats,
    Tokens,
    Total,
  ],
  synchronize: false,
  migrationsRun: false,
  migrations: [path.join(migrationsDir, '/**/*{.ts,.js}')],
  logging: process.env.LOGGING === '1',
};

export default typeormConfig;
