import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { APP_INTERCEPTOR } from '@nestjs/core';
import typeormConfig from '@common/typeorm.config';
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
import { SentryModule } from '@ntegral/nestjs-sentry';
import { ContractModule } from './contract/contract.module';

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
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        dsn: config.get('SENTRY_DSN'),
        debug: config.get('SENTRY_DEBUG') === '1',
        environment: process.env.NODE_ENV ?? 'development',
        logLevels: config.get('SENTRY_LOG_LEVELS')
          ? config.get('SENTRY_LOG_LEVELS').split(',')
          : ['error'], // ['log' | 'error' | 'warn' | 'debug' | 'verbose'];
        enabled: !!config.get('SENTRY_DSN'),
      }),
      inject: [ConfigService],
    }),
    HolderModule,
    TransferModule,
    TokenModule,
    CollectionModule,
    ContractModule,
    EventModule,
    ExtrinsicModule,
    AccountModule,
    BlockModule,
    StatisticsModule,
    TransactionModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TimestampTransformInterceptor,
    },
  ],
})
export class AppModule {}
