import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '@entities/Account';
import { AccountsScannerService } from './accounts-scanner.service';
import { SdkModule } from '../sdk/sdk.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), ConfigModule, SdkModule],
  providers: [AccountsScannerService],
  exports: [AccountsScannerService],
})
export class ScannersModule {}
