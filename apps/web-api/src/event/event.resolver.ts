import {
  Args,
  ArgsType,
  Field,
  Info,
  InputType,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsString,
  IDataListResponse,
  IGQLQueryArgs,
  ListDataType,
  TOrderByParams,
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

  @Field(() => GQLWhereOpsString, { nullable: true })
  fee?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  amount?: GQLWhereOpsString;

  @Field(() => [EventWhereParams], { nullable: true })
  _and?: EventWhereParams[];

  @Field(() => [EventWhereParams], { nullable: true })
  _or?: EventWhereParams[];
}

@InputType()
class EventOrderByParams implements TOrderByParams<EventDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_index?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_number?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  amount?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  fee?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<EventDTO>
{
  @Field(() => EventWhereParams, { nullable: true })
  where?: EventWhereParams;

  @Field(() => EventOrderByParams, { nullable: true })
  order_by?: EventOrderByParams;
}

@ObjectType()
class EventDataResponse extends ListDataType(EventDTO) {}

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
