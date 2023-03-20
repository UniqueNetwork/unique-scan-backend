import * as express from 'express';

import {
  DynamicModule,
  INestApplication,
  INestApplicationContext,
  INestMicroservice,
  Logger,
} from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

import { HealthService, PrometheusHealthService } from './health';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';

import { NoopMetricsController } from './controllers/noop.metrics.controller';

class MonitoringApp {}

export const startMetricsServer = async (
  mainApp: INestApplication | INestMicroservice | INestApplicationContext,
) => {
  const healthService = mainApp.get(HealthService);
  const prometheusHealthService = mainApp.get(PrometheusHealthService);
  const config = mainApp.get(ConfigService);

  const port = config.get<number>('prometheusPort');

  if (!port) {
    return;
  }

  const server = express();

  const metricsAppModule: DynamicModule = {
    imports: [
      PrometheusModule.register({
        defaultMetrics: { enabled: false },
        controller: NoopMetricsController,
      }),
    ],
    providers: [
      { provide: HealthService, useValue: healthService },
      { provide: PrometheusHealthService, useValue: prometheusHealthService },
    ],
    controllers: [HealthController, MetricsController],
    module: MonitoringApp,
  };

  const metricsApp = await NestFactory.create(
    metricsAppModule,
    new ExpressAdapter(server),
  );

  await metricsApp.init();
  await metricsApp.listen(port);

  Logger.log(`Metrics application is running on :${port}`);
};
