import { Block } from '@entities/Block';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { IBlockDataContainer } from '../subscribers/blocks.subscriber.service';

@Injectable()
export class BlockService {
  constructor(
    @InjectRepository(Block)
    private blocksRepository: Repository<Block>,
  ) {}

  async upsert(blockData): Promise<IBlockDataContainer> {
    await this.blocksRepository.upsert(blockData, ['block_number']);
    return blockData;
  }
}
