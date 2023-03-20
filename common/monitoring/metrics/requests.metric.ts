import { makeHistogramProvider } from '@willsoto/nestjs-prometheus';

export const REQUESTS_METRIC = 'http_requests';

export const RequestsMetric = makeHistogramProvider({
  name: REQUESTS_METRIC,
  help: 'HTTP requests - Duration in seconds',
  labelNames: ['method', 'status', 'path', 'use'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 10],
});
