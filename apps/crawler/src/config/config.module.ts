import * as process from 'process';
import { ConfigModule } from '@nestjs/config';
import { CacheConfig, createCacheConfig } from './cache.config';
import { SentryConfig, createSentryConfig } from './sentry.config';
import {
  SubscribersConfig,
  createSubscribersConfig,
} from './subscribers.config';

export type Config = {
  logLevels: Array<string>;

  chainWsUrl: string;

  archiveGqlUrl: string;

  sentry: SentryConfig;

  cache: CacheConfig;

  subscribers: SubscribersConfig;

  scanTypesBundle: string;

  scanRangeFrom: number;

  scanRangeTo?: number;

  rescan: boolean;

  prometheusPort: number;

  batchSize: number;
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

  scanTypesBundle: process.env.SCAN_TYPES_BUNDLE || 'quartz',

  scanRangeFrom: +process.env.SCAN_RANGE_FROM || 0,

  scanRangeTo: +process.env.SCAN_RANGE_TO || undefined,

  rescan: process.env.SCAN_FORCE_RESCAN === 'true',

  prometheusPort: +process.env.PROMETHEUS_PORT || 9090,

  batchSize: +process.env.BATCH_SIZE || 10,
});

export const GlobalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [loadConfig],
});
