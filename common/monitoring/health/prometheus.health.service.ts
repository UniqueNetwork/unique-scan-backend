import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';

import { HealthService } from './health.service';
import { HEALTH_METRIC } from '../metrics';

@Injectable()
export class PrometheusHealthService {
  constructor(
    private readonly healthService: HealthService,
    @InjectMetric(HEALTH_METRIC)
    private readonly healthGauge: Gauge,
  ) {}

  async refresh(): Promise<void> {
    const results = await this.healthService.getStatuses();

    results.forEach(({ key, value }) => {
      this.healthGauge.labels(key).set(value ? 1 : 0);
    });
  }
}
