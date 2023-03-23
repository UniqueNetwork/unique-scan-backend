import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client } from '@unique-nft/substrate-client';
import { sdkFactory } from './sdk-factory';
import { SdkService } from './sdk.service';
import { Config } from '../config/config.module';
import '@unique-nft/substrate-client/tokens';
import '@unique-nft/substrate-client/balance';
import { CacheProviderModule } from '../cache/cache-provider.module';

@Global()
@Module({
  imports: [ConfigModule, CacheProviderModule],
  providers: [
    {
      provide: Client,
      useFactory: async (configService: ConfigService<Config>) =>
        sdkFactory(configService.get('chainWsUrl')),
      inject: [ConfigService],
    },
    SdkService,
  ],
  exports: [SdkService],
})
export class SdkModule {}
