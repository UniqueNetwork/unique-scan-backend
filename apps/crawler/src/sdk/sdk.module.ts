import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SdkService } from './sdk.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SdkService],
  exports: [SdkService],
})
export class SdkModule {}
