import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorConfigService } from '../processor.config.service';
import { SdkService } from '../sdk.service';
import { CollectionsProcessor } from './collections-processor';
import { TokensProcessor } from './tokens-processor';

@Module({
  imports: [TypeOrmModule.forFeature([Collections, Tokens]), ConfigModule],
  providers: [
    SdkService,
    ProcessorConfigService,
    CollectionsProcessor,
    TokensProcessor,
  ],
  exports: [CollectionsProcessor, TokensProcessor],
})
export class ProcessorsModule {}
