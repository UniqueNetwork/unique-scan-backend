import { Args, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse, ListDataType } from '../utils/gql-query-args';
import { EventService } from './event.service';
import { TokenEventDTO } from './token-event.dto';
import { QueryArgs } from './token-event.types';
import { TokenEventService } from './token-event.service';

@ObjectType()
class TokenEventDataResponse extends ListDataType(TokenEventDTO) {}

@Resolver(() => TokenEventDTO)
export class TokenEventResolver {
  constructor(
    private service: EventService,
    private eventService: TokenEventService,
  ) {}

  @Query(() => TokenEventDataResponse)
  public async token_events(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<TokenEventDTO>> {
    const { count, data } = await this.service.findTokenEvents(args);

    return {
      count,
      data: await this.eventService.mapEventData(data),
    };
  }
}
