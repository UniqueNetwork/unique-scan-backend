import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsIntEq,
  ListDataType,
  TOrderByParams,
} from '../utils/gql-query-args';
import { AttributesDto } from './attributes.dto';

@InputType()
export class AttributesWhereParams {
  @Field(() => GQLWhereOpsIntEq, { nullable: true })
  collection_id?: GQLWhereOpsIntEq;

  @Field(() => GQLWhereOpsIntEq, { nullable: true })
  token_id?: GQLWhereOpsIntEq;
}

@InputType()
export class AttributesOrderByParams
  implements Partial<TOrderByParams<AttributesDto>>
{
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  token_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  trait_type?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  value?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  value_number?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  value_string?: GQLOrderByParamsArgs;
}

@ArgsType()
export class AttributesQueryArgs extends GQLQueryPaginationArgs {
  @Field(() => AttributesWhereParams, { nullable: true })
  where?: AttributesWhereParams;

  @Field(() => AttributesOrderByParams, { nullable: true })
  order_by?: AttributesOrderByParams;
}

@ObjectType()
export class AttributesDataResponse extends ListDataType(AttributesDto) {}
