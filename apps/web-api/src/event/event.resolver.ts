import {
  Args,
  ArgsType,
  Field,
  InputType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  GQLQueryPaginationArgs,
  GQLWhereOpsString,
  IGQLQueryArgs,
  TWhereParams,
} from '../utils/gql-query-args';
import { EventDTO } from './event.dto';
import { EventService } from './event.service';

@InputType()
class EventWhereParams implements TWhereParams<EventDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  block_index?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  block_number?: GQLWhereOpsString;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<EventDTO>
{
  @Field(() => EventWhereParams, { nullable: true })
  where?: EventWhereParams;
}

@Resolver(() => EventDTO)
export class EventResolver {
  constructor(private service: EventService) {}

  @Query(() => [EventDTO])
  public async events(@Args() args: QueryArgs): Promise<EventDTO[]> {
    return this.service.find(args);
  }
}
