import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  ListDataType,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { EventDTO } from './event.dto';

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

  @Field(() => GQLWhereOpsString, { nullable: true })
  section?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  method?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  token_id?: GQLWhereOpsInt;

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
export class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<EventDTO>
{
  @Field(() => EventWhereParams, { nullable: true })
  where?: EventWhereParams;

  @Field(() => EventOrderByParams, { nullable: true })
  order_by?: EventOrderByParams;
}

@ObjectType()
export class EventDataResponse extends ListDataType(EventDTO) {}
