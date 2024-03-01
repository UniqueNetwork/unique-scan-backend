import * as dotenv from 'dotenv';
import * as path from 'path';

import { DataSourceOptions } from 'typeorm';

import {
  Account,
  Attribute,
  Block,
  Chain,
  Collections,
  CollectionsStats,
  Contract,
  Event,
  Extrinsic,
  HarvesterError,
  System,
  Tokens,
  Total,
  TokensStats,
  EvmTransaction,
  TokensOwners,
} from './entities';

dotenv.config();
const migrationsDir = path.join(__dirname, '..', 'migrations');
const isTestMode = process.env.NODE_ENV === 'test';

const typeormConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: +process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: [
    Account,
    Attribute,
    Block,
    Chain,
    Collections,
    CollectionsStats,
    Contract,
    Event,
    Extrinsic,
    HarvesterError,
    System,
    TokensStats,
    TokensOwners,
    Tokens,
    Total,
    EvmTransaction,
  ],
  synchronize: false,
  migrationsRun: false,
  migrations: isTestMode ? [] : [path.join(migrationsDir, '/**/*{.ts,.js}')],
  logging: process.env.LOGGING === '1',
};

export default typeormConfig;
