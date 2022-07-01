import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SdkService } from '../sdk.service';
import { CollectionsProcessor } from './collections-processor';
import { TokensProcessor } from './tokens-processor';

@Module({
  imports: [TypeOrmModule.forFeature([Collections, Tokens])],
  providers: [SdkService, CollectionsProcessor, TokensProcessor],
  exports: [CollectionsProcessor, TokensProcessor],
})
export class ProcessorsModule {}
