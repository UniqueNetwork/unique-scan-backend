import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Sdk } from '@unique-nft/substrate-client';
import { sdkFactory } from './sdk-factory';
import { SdkService } from './sdk.service';
import { Config } from '../config/config.module';
import '@unique-nft/substrate-client/extrinsics';
import '@unique-nft/substrate-client/tokens';
import '@unique-nft/substrate-client/balance';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Sdk,
      useFactory: async (configService: ConfigService<Config>) =>
        sdkFactory(configService.get('chainWsUrl')),
      inject: [ConfigService],
    },
    SdkService,
  ],
  exports: [SdkService],
})
export class SdkModule {}
