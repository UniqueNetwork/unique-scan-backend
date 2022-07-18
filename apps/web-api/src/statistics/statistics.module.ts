import { Total } from '@entities/Total';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsResolver } from './statistics.resolver';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Total])],
  providers: [StatisticsResolver, StatisticsService],
})
export class StatisticsModule {}
