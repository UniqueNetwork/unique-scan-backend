import { Block } from '@entities/Block';
import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Event } from '@entities/Event';
import { EvmTransaction } from '@entities/EvmTransaction';
import { Extrinsic } from '@entities/Extrinsic';
import { Account } from '@entities/Account';
import { Attribute } from '@common/entities';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionService } from './collection.service';
import { AccountService } from './account/account.service';
import { TokenService } from './token/token.service';
import { BlockService } from './block.service';
import { EventService } from './event/event.service';
import { ExtrinsicService } from './extrinsic.service';
import { EventArgumentsService } from './event/event.arguments.service';
import { TokenNestingService } from './token/nesting.service';
import { EvmService } from './evm/evm.service';
import { TokensOwners } from '@entities/TokensOwners';
import { SdkModule } from '@common/sdk/sdk.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Attribute,
      Block,
      Collections,
      Event,
      Extrinsic,
      Tokens,
      TokensOwners,
      EvmTransaction,
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
    EvmService,
  ],
  exports: [
    AccountService,
    BlockService,
    CollectionService,
    EventService,
    ExtrinsicService,
    TokenService,
    TokenNestingService,
    EvmService,
  ],
})
export class ServicesModule {}
