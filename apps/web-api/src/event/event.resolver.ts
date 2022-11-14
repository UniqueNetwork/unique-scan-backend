import { Args, Info, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse } from '../utils/gql-query-args';
import { EventDTO } from './event.dto';
import { EventService } from './event.service';
import { EventDataResponse, QueryArgs } from './event.types';

@Resolver(() => EventDTO)
export class EventResolver {
  constructor(private service: EventService) {}

  @Query(() => EventDataResponse)
  public async events(
    @Args() args: QueryArgs,
    @Info() info,
  ): Promise<IDataListResponse<EventDTO>> {
    return this.service.find(args, info);
  }
}
