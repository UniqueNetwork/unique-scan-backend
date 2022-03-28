import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import typeormConfig from '@common/typeorm.config';
import { GraphQLModule } from '@nestjs/graphql';
import { Block } from '@entities/Block';
import { HolderModule } from './holder/holder.module';
import { Tokens } from '@entities/Tokens';
import { Collections } from '@entities/Collections';
import { TransferModule } from './transfer/transfer.module';
import { Event } from '@entities/Event';
import { TokenModule } from './tokens/token.module';
import { CollectionModule } from './collection/collection.module';
import { CollectionsStats } from '@entities/CollectionsStats';
import { EventModule } from './event/event.module';
import { ExtrinsicModule } from './extrinsic/extrinsic.module';
import { Extrinsic } from '@entities/Extrinsic';
import { AccountModule } from './account/account.module';
import { Account } from '@entities/Account';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      ...typeormConfig,
      entities: [
        Block,
        Tokens,
        Collections,
        CollectionsStats,
        Event,
        Extrinsic,
        Account,
      ],
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      debug: true,
      playground: true,
      sortSchema: true,
    }),
    HolderModule,
    TransferModule,
    TokenModule,
    CollectionModule,
    EventModule,
    ExtrinsicModule,
    AccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
