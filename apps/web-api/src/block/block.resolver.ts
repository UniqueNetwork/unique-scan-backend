import { Args, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse } from '../utils/gql-query-args';
import { BlockDto, LastBlockDto } from './block.dto';
import { BlockService } from './block.service';
import {
  BlockDataResponse,
  BlockQueryArgs,
  LastBlockDataResponse,
  LastBlockQueryArgs,
} from './block.types';

@Resolver(() => BlockDto)
export class BlockResolver {
  constructor(private service: BlockService) {}

  @Query(() => BlockDataResponse)
  public async block(
    @Args() args: BlockQueryArgs,
  ): Promise<IDataListResponse<BlockDto>> {
    return this.service.find(args);
  }

  @Query(() => LastBlockDataResponse)
  public async last_block(
    @Args() args: LastBlockQueryArgs,
  ): Promise<IDataListResponse<LastBlockDto>> {
    return this.service.findLastBlock(args);
  }
}
