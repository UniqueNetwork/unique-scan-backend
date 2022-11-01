import { Args, Info, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse, ListDataType } from '../utils/gql-query-args';
import { EventService } from './event.service';
import { TokenEventDTO } from './token-event.dto';
import { QueryArgs } from './token-event.types';

@ObjectType()
class TokenEventDataResponse extends ListDataType(TokenEventDTO) {}

@Resolver(() => TokenEventDTO)
export class TokenEventResolver {
  constructor(private service: EventService) {}

  @Query(() => TokenEventDataResponse)
  public async token_events(
    @Args() args: QueryArgs,
    @Info() info,
  ): Promise<IDataListResponse<TokenEventDTO>> {
    return this.service.findTokenEvents(args, info);
  }
}
