import { Total } from '@entities/Total';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsV2Resolver } from './statisticsV2.resolver';
import { StatisticsV2Service } from './statisticsV2.service';

@Module({
  // imports: [TypeOrmModule.forFeature([Total])],
  providers: [StatisticsV2Resolver, StatisticsV2Service],
  // providers: [StatisticsV2Service],
})
export class StatisticsV2Module {}
