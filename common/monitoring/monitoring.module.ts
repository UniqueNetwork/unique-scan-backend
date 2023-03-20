import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import {
  HealthService,
  PrometheusHealthService,
  RedisHealthIndicator,
} from './health';
import { NoopMetricsController } from './controllers/noop.metrics.controller';
import {
  CurrentTrackingExtrinsicsMetric,
  HealthMetric,
  RequestsMetric,
  TotalTrackingExtrinsicsMetric,
} from './metrics';
import { RequestsMiddleware } from './middleware/requests.middleware';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      controller: NoopMetricsController,
    }),
    TerminusModule,
  ],
  providers: [
    HealthService,
    PrometheusHealthService,
    RedisHealthIndicator,
    CurrentTrackingExtrinsicsMetric,
    TotalTrackingExtrinsicsMetric,
    RequestsMetric,
    HealthMetric,
  ],
  exports: [CurrentTrackingExtrinsicsMetric, TotalTrackingExtrinsicsMetric],
})
export class MonitoringModule implements NestModule {
  // eslint-disable-next-line class-methods-use-this
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestsMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
