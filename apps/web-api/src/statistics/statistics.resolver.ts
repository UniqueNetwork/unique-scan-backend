import { Args, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse } from '../utils/gql-query-args';
import { BlockDto } from './block.dto';
import { StatisticsService } from './statistics.service';
import { BlockDataResponse, BlockQueryArgs } from './block.types';

@Resolver(() => BlockDto)
export class StatisticsResolver {
  constructor(private service: StatisticsService) {}

  @Query(() => BlockDataResponse)
  public async block(
    @Args() args: BlockQueryArgs,
  ): Promise<IDataListResponse<BlockDto>> {
    return this.service.find(args);
  }
}
