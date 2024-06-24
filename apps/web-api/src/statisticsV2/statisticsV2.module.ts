import { Module } from '@nestjs/common';
import { StatisticsV2Resolver } from './statisticsV2.resolver';
import { StatisticsV2Service } from './statisticsV2.service';
import { StatisticsV2Repository } from './statisticsV2.repository';

@Module({
  providers: [
    StatisticsV2Resolver,
    StatisticsV2Service,
    StatisticsV2Repository,
  ],
})
export class StatisticsV2Module {}
