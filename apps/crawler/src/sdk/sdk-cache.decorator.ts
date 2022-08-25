import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

export function SdkCache(key?: string) {
  const cacheManagerInjection = Inject(CACHE_MANAGER);

  return function (
    target: Record<string, any>,
    _,
    descriptor: PropertyDescriptor,
  ) {
    cacheManagerInjection(target, 'cacheManager');

    const method = descriptor.value;

    descriptor.value = async function (...args: Array<any>) {
      const entryKey = `${key}[${args
        .map((res) => JSON.stringify(res))
        .join(',')}]`;

      const cacheManager = this.cacheManager as Cache;
      const cacheData = await cacheManager.get(entryKey);

      if (cacheData) {
        return cacheData;
      }

      const result = await method.apply(this, args);
      if (result) {
        // Set cache
        await cacheManager.set(entryKey, result);
      }

      return result;
    };
  };
}
