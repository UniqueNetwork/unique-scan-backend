import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { HealthItem } from '../../types';

export abstract class BaseHealthIndicator extends HealthIndicator {
  abstract key: string;

  abstract check(): Promise<HealthIndicatorResult>;

  async isHealthy(): Promise<HealthItem> {
    const value = await this.check()
      .then(() => true)
      .catch(() => false);

    return { key: this.key, value };
  }

  protected async onDisabled(): Promise<HealthIndicatorResult> {
    return super.getStatus(this.key, false, { message: 'disabled' });
  }

  protected disable() {
    this.check = this.onDisabled;
  }

  protected getStatus(
    key: string,
    isHealthy: boolean,
    data?: Record<string, any>,
  ): HealthIndicatorResult {
    const status = super.getStatus(key, isHealthy, data);

    if (isHealthy) return status;

    throw new HealthCheckError(key, status);
  }
}
