import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';

export const HEALTH_METRIC = 'health_checks';

export const HealthMetric = makeGaugeProvider({
  name: HEALTH_METRIC,
  help: 'Health status - key is service, 1 for ok, 0 for error',
  labelNames: ['key'],
});
