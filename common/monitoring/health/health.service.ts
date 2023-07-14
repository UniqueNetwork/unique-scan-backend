import { Injectable } from '@nestjs/common';
import { totalmem } from 'os';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import {
  RedisHealthIndicator,
} from './health-indicators';
import { HealthItem } from '../types';

const memoryRSS = 'memory_RSS';
const rssThreshold = totalmem() * 0.9;

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private redis: RedisHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  getStatuses(): Promise<HealthItem[]> {
    return Promise.all([
      this.redis.isHealthy(),
      this.isMemoryHealthy(),
    ]);
  }

  private async isMemoryHealthy(): Promise<HealthItem> {
    const value = await this.memory
      .checkRSS(memoryRSS, rssThreshold)
      .then(() => true)
      .catch(() => true);

    return { key: memoryRSS, value };
  }

  @HealthCheck()
  public async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.redis.check(),
      () => this.memory.checkRSS(memoryRSS, rssThreshold),
    ]);
  }
}
