export type SentryConfig = {
  dsn: string;
  debug: boolean;
  environment: string;
  logLevels: string[];
  enabled: boolean;
};

export function createSentryConfig(env: Record<string, string>): SentryConfig {
  const { NODE_ENV, SENTRY_DSN, SENTRY_DEBUG, SENTRY_LOG_LEVELS } = env;

  return {
    dsn: SENTRY_DSN,
    debug: SENTRY_DEBUG === '1',
    environment: NODE_ENV ?? 'development',
    logLevels: SENTRY_LOG_LEVELS ? SENTRY_LOG_LEVELS.split(',') : ['error'],
    enabled: !!SENTRY_DSN,
  };
}
