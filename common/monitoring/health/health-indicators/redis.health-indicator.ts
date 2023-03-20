import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

import { BaseHealthIndicator } from './base.health-indicator';

// todo - rather meaningless indicator, 'cause app crashes on redis connection lost

export enum CacheType {
  DEFAULT = 'Default',
  REDIS = 'Redis',
}

interface CacheConfigBase {
  type: CacheType;
  ttl: number;
}

export interface DefaultCacheConfig extends CacheConfigBase {
  type: CacheType.DEFAULT;
}

export interface RedisCacheConfig extends CacheConfigBase {
  type: CacheType.REDIS;
  host: string;
  port: number;
  db: number;
}

export type CacheConfig = DefaultCacheConfig | RedisCacheConfig;

@Injectable()
export class RedisHealthIndicator extends BaseHealthIndicator {
  key = 'redis';

  private readonly config: RedisCacheConfig;

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    configService: ConfigService,
  ) {
    super();
    const config = configService.get<CacheConfig>('cache');

    if (config.type === CacheType.REDIS) {
      this.config = config;
    } else {
      this.disable();
    }
  }

  private tryGet(): Promise<boolean> {
    return this.cache
      .get(Math.random().toString())
      .then(() => true)
      .catch(() => false);
  }

  async check(): Promise<HealthIndicatorResult> {
    const { host, port, db } = this.config;

    const isHealthy = await this.tryGet();

    return this.getStatus(this.key, isHealthy, { host, port, db });
  }
}
