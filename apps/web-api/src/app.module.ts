import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { APP_INTERCEPTOR } from '@nestjs/core';
import typeormConfig from '@common/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HolderModule } from './holder/holder.module';
import { TransferModule } from './transfer/transfer.module';
import { TokenModule } from './tokens/token.module';
import { CollectionModule } from './collection/collection.module';
import { EventModule } from './event/event.module';
import { ExtrinsicModule } from './extrinsic/extrinsic.module';
import { AccountModule } from './account/account.module';
import { BlockModule } from './block/block.module';
import { TimestampTransformInterceptor } from './timestamp.interceptor';
import { StatisticsModule } from './statistics/statistics.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      ...typeormConfig,
    }),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: true,
      debug: true,
      playground: true,
      sortSchema: true,
      path: '/v1/graphql',
    }),
    HolderModule,
    TransferModule,
    TokenModule,
    CollectionModule,
    EventModule,
    ExtrinsicModule,
    AccountModule,
    BlockModule,
    StatisticsModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TimestampTransformInterceptor,
    },
  ],
})
export class AppModule {}
