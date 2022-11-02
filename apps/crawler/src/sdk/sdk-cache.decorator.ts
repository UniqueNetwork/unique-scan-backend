import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Config } from '../config/config.module';

export function SdkCache({
  key,
  blockHashIndex,
}: {
  key: string;
  blockHashIndex?: number;
}) {
  const cacheManagerInjection = Inject(CACHE_MANAGER);
  const configServiceInjection = Inject(ConfigService);

  return function (
    target: Record<string, any>,
    _,
    descriptor: PropertyDescriptor,
  ) {
    configServiceInjection(target, 'configService');

    cacheManagerInjection(target, 'cacheManager');

    const method = descriptor.value;

    descriptor.value = async function (...args: Array<any>) {
      const configService = this.configService as ConfigService<Config>;

      const cacheManager = this.cacheManager as Cache;

      let blockHash = null;
      if (blockHashIndex !== undefined) {
        blockHash = args[blockHashIndex];
      }

      const entryKey = `${key}[${args
        .map((res) => JSON.stringify(res))
        .join(',')}]`;

      // Get data from cache only while rescan mode or from the same block
      if (configService.get('rescan') || blockHash) {
        const cachedValue = await cacheManager.get(entryKey);

        if (cachedValue !== undefined) {
          return cachedValue;
        }
      }

      // If no cache found, get data by real sdk call.
      const result = await method.apply(this, args);

      // Set cache value.
      await cacheManager.set(entryKey, result);

      return result;
    };
  };
}
