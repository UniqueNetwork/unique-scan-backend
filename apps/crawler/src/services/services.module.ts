import { Block } from '@entities/Block';
import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Event } from '@entities/Event';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Extrinsic } from '@entities/Extrinsic';
import { Account } from '@entities/Account';
import { CollectionService } from './collection.service';
import { AccountService } from './account/account.service';
import { TokenService } from './token/token.service';
import { BlockService } from './block.service';
import { EventService } from './event/event.service';
import { ExtrinsicService } from './extrinsic.service';
import { EventArgumentsService } from './event/event.arguments.service';
import { SdkModule } from '../sdk/sdk.module';
import { TokenNestingService } from './token/nesting.service';

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
    SdkModule,
  ],
  providers: [
    AccountService,
    BlockService,
    CollectionService,
    EventService,
    EventArgumentsService,
    ExtrinsicService,
    TokenService,
    TokenNestingService,
  ],
  exports: [
    AccountService,
    BlockService,
    CollectionService,
    EventService,
    ExtrinsicService,
    TokenService,
    TokenNestingService,
  ],
})
export class ServicesModule {}
