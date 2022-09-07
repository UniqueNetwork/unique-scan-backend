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
import { TokenWriterService } from './token.writer.service';
import { BlockWriterService } from './block.writer.service';
import { EventService } from './event/event.service';
import { ExtrinsicWriterService } from './extrinsic.writer.service';

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
  providers: [
    AccountWriterService,
    BlockWriterService,
    CollectionWriterService,
    EventService,
    ExtrinsicWriterService,
    TokenWriterService,
  ],
  exports: [
    AccountWriterService,
    BlockWriterService,
    CollectionWriterService,
    EventService,
    ExtrinsicWriterService,
    TokenWriterService,
  ],
})
export class WritersModule {}
