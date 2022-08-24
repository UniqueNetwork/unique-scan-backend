import * as process from 'process';
import { ConfigModule } from '@nestjs/config';
import { CacheConfig, createCacheConfig } from './cache.config';
import { createSentryConfig, SentryConfig } from './sentry.config';
import {
  createSubscribersConfig,
  SubscribersConfig,
} from './subscribers.config';

export type Config = {
  logLevels: Array<string>;

  chainWsUrl: string;

  archiveGqlUrl: string;

  sentry: SentryConfig;

  cache: CacheConfig;

  subscribers: SubscribersConfig;
};

const loadConfig = (): Config => ({
  logLevels: process.env.LOG_LEVELS
    ? process.env.LOG_LEVELS.split(',')
    : ['log', 'error', 'warn'],

  chainWsUrl: process.env.CHAIN_WS_URL,

  archiveGqlUrl: process.env.ARCHIVE_GQL_URL,

  sentry: createSentryConfig(process.env),

  cache: createCacheConfig(process.env),

  subscribers: createSubscribersConfig(process.env),
});

export const GlobalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [loadConfig],
});
