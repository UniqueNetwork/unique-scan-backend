import { Total } from '@entities/Total';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockResolver } from './statistics.resolver';
import { BlockService } from './block.service';

@Module({
  imports: [TypeOrmModule.forFeature([Total])],
  providers: [BlockResolver, BlockService],
})
export class BlockModule {}
