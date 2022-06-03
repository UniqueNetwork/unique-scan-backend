import { Block } from '@entities/Block';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockResolver } from './block.resolver';
import { BlockService } from './block.service';

@Module({
  imports: [TypeOrmModule.forFeature([Block])],
  providers: [BlockResolver, BlockService],
})
export class BlockModule {}
