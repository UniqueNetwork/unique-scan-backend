import { Args, Info, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse } from '../utils/gql-query-args';
import { BlockDto } from './block.dto';
import { BlockService } from './block.service';
import { BlockDataResponse, BlockQueryArgs } from './block.types';

@Resolver(() => BlockDto)
export class BlockResolver {
  constructor(private service: BlockService) {}

  @Query(() => BlockDataResponse)
  public async block(
    @Args() args: BlockQueryArgs,
    @Info() info,
  ): Promise<IDataListResponse<BlockDto>> {
    return this.service.find(args, info);
  }
}
