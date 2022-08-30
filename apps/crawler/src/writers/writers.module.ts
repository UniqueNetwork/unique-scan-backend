import { Block } from '@entities/Block';
import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Event } from '@entities/Event';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Extrinsic } from '@entities/Extrinsic';
import { Account } from '@entities/Account';
import { CollectionWriterService } from './collection.writer.service';
import { AccountWriterService } from './account.writer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Block,
      Collections,
      Event,
      Extrinsic,
      Tokens,
    ]),
    ConfigModule,
  ],
  providers: [AccountWriterService, CollectionWriterService],
  exports: [AccountWriterService, CollectionWriterService],
})
export class WritersModule {}
