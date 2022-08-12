import { SentryService } from '@ntegral/nestjs-sentry';
import { Inject } from '@nestjs/common';

export const SentryWrapper = (emptyResult?: Record<string, unknown>) => {
  const injectSentry = Inject(SentryService);

  return (target: any, _name: string, descriptor: PropertyDescriptor) => {
    injectSentry(target, 'sentry');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalMethod: () => Promise<void> = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const sentry = this.sentry as SentryService;
        sentry.instance().captureException(error);
        if (emptyResult) {
          return emptyResult;
        }

        throw error;
      }
    };
  };
};
