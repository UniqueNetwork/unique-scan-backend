import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { sdkFactory } from './factory';
import { SdkService } from './sdk.service';
import { Sdk } from '@unique-nft/sdk';
import '@unique-nft/sdk/extrinsics';
import '@unique-nft/sdk/tokens';
import '@unique-nft/sdk/balance';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Sdk,
      useFactory: async (configService: ConfigService) =>
        sdkFactory(configService.get('CHAIN_WS_URL')),
      inject: [ConfigService],
    },
    SdkService,
  ],
  exports: [SdkService],
})
export class SdkModule {}
