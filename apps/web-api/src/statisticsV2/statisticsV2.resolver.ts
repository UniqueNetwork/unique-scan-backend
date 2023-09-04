import { Args, Query, Resolver } from '@nestjs/graphql';
import { StatisticsV2Service } from './statisticsV2.service';
import {
  BlockNumbersInputDto,
  BlockNumbersResponseDto,
  AllEventsResponseDto,
  GroupedEventsInputDto,
  GroupedEventsResponseDto,
} from './dto';
import {
  AllEventsResponse,
  BlockNumbersResponse,
  GroupedEventsResponse,
} from './types';

@Resolver()
export class StatisticsV2Resolver {
  constructor(private service: StatisticsV2Service) {}

  @Query(() => BlockNumbersResponseDto)
  public async blockNumbersByInterval(
    @Args() args: BlockNumbersInputDto,
  ): Promise<BlockNumbersResponse> {
    return this.service.getBlockNumbers(args);
  }

  @Query(() => AllEventsResponseDto)
  public async allEvents(): Promise<AllEventsResponse> {
    return this.service.getAllEvents();
  }

  @Query(() => AllEventsResponseDto)
  public async allExtrinsics(): Promise<AllEventsResponse> {
    return this.service.getAllExtrinsics();
  }

  @Query(() => GroupedEventsResponseDto)
  public async eventsGroupedByInterval(
    @Args() args: GroupedEventsInputDto,
  ): Promise<GroupedEventsResponse> {
    return this.service.getEventsGroupedByInterval(args);
  }

  @Query(() => GroupedEventsResponseDto)
  public async extrinsicsGroupedByInterval(
    @Args() args: GroupedEventsInputDto,
  ): Promise<GroupedEventsResponse> {
    return this.service.getEventsGroupedByInterval(args);
  }
}
