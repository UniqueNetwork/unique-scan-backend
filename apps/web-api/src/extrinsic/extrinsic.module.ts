import { Event } from '@entities/Event';
import { Extrinsic } from '@entities/Extrinsic';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExtrinsicResolver } from './extrinsic.resolver';
import { ExtrinsicService } from './extrinsic.service';

@Module({
  imports: [TypeOrmModule.forFeature([Extrinsic, Event])],
  providers: [ExtrinsicResolver, ExtrinsicService],
})
export class ExtrinsicModule {}
