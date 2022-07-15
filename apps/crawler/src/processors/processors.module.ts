import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorConfigService } from '../processor.config.service';
import { SdkService } from '../sdk.service';
import { FooProcessor } from './foo.processor';
import { ProcessorService } from './processor.service';
import { SubstrateProcessor } from '@subsquid/substrate-processor';

@Module({
  imports: [TypeOrmModule.forFeature([Collections, Tokens]), ConfigModule],
  providers: [
    SubstrateProcessor,
    ProcessorService,
    SdkService,
    ProcessorConfigService,
    FooProcessor,
  ],
  exports: [ProcessorService, FooProcessor],
})
export class ProcessorsModule {}
