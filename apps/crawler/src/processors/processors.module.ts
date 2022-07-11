import { Block } from '@entities/Block';
import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SdkService } from '../sdk.service';
import { BlockProcessor } from './block-processor';
import { CollectionsProcessor } from './collections-processor';
import { TokensProcessor } from './tokens-processor';

@Module({
  imports: [TypeOrmModule.forFeature([Collections, Tokens, Block])],
  providers: [
    SdkService,
    CollectionsProcessor,
    TokensProcessor,
    BlockProcessor,
  ],
  exports: [CollectionsProcessor, TokensProcessor, BlockProcessor],
})
export class ProcessorsModule {}
