import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorConfigService } from '../processor.config.service';
import { SdkService } from '../sdk.service';
import { ProcessorService } from './processor.service';
import { SubstrateProcessor } from '@subsquid/substrate-processor';
import { CollectionsSubscriberService } from './collections-subscriber.service';

@Module({
  imports: [TypeOrmModule.forFeature([Collections, Tokens]), ConfigModule],
  providers: [
    SubstrateProcessor,
    ProcessorService,
    SdkService,
    ProcessorConfigService,
    CollectionsSubscriberService,
  ],
  exports: [ProcessorService, CollectionsSubscriberService],
})
export class ProcessorsModule {}
