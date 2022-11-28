import { ArgsType, Field, InputType } from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsBoolean,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { CollectionEventDTO } from './collection-event.dto';

@InputType()
class CollectionEventWhereParams
  implements TWhereParams<Partial<CollectionEventDTO>>
{
  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  action?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  author?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsBoolean, { nullable: true })
  result?: GQLWhereOpsBoolean;

  @Field(() => [CollectionEventWhereParams], { nullable: true })
  _and?: CollectionEventWhereParams[];

  @Field(() => [CollectionEventWhereParams], { nullable: true })
  _or?: CollectionEventWhereParams[];
}

@InputType()
class CollectionEventOrderByParams
  implements TOrderByParams<Partial<CollectionEventDTO>>
{
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  action?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  fee?: GQLOrderByParamsArgs;
}

@ArgsType()
export class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<Partial<CollectionEventDTO>>
{
  @Field(() => CollectionEventWhereParams, { nullable: true })
  where?: CollectionEventWhereParams;

  @Field(() => CollectionEventOrderByParams, { nullable: true })
  order_by?: CollectionEventOrderByParams;
}
