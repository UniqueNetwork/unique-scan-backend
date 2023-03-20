import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Histogram } from 'prom-client';
import responseTime from 'response-time';

import { REQUESTS_METRIC } from '../metrics';

@Injectable()
export class RequestsMiddleware implements NestMiddleware {
  private readonly excluded: string[] = ['/favicon.ico', '/metrics'];

  private readonly defaultUse = 'NA';

  private readonly logger = new Logger(RequestsMiddleware.name);

  constructor(
    @InjectMetric(REQUESTS_METRIC)
    private readonly requestsHistogram: Histogram,
  ) {}

  use(req, res, next) {
    responseTime((request, response, time) => {
      const { url = 'unknown_url', method } = request;

      const [path, query] = url.split('?');
      if (this.excluded.includes(path)) return;

      const status = RequestsMiddleware.normalizeStatus(res.statusCode);
      const use = this.getUse(query);

      const labels = { method, status, path, use };

      this.requestsHistogram.observe(labels, time / 1000);
    })(req, res, next);
  }

  private static normalizeStatus(statusCode: number): string {
    if (statusCode >= 100 && statusCode < 200) return '1xx';
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';

    return '5xx';
  }

  private getUse(query?: string): string {
    try {
      if (!query) return this.defaultUse;

      const params = query.split('&').map((val) => val.split('='));

      const useParam = params.find((param) => param[0] === 'use');

      return useParam ? useParam[1] : this.defaultUse;
    } catch (error) {
      this.logger.warn(`Failed to parse query "${query}": ${error.message}`);

      return this.defaultUse;
    }
  }
}
