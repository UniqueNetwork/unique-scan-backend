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
import { BlockDto } from './block.dto';

@InputType()
class BlockWhereParams implements TWhereParams<BlockDto> {
  @Field(() => GQLWhereOpsInt, { nullable: true })
  block_number?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  block_hash?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  parent_hash?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  extrinsics_root?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  total_events?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  total_extrinsics?: GQLWhereOpsInt;

  @Field(() => [BlockWhereParams], { nullable: true })
  _and?: BlockWhereParams[];

  @Field(() => [BlockWhereParams], { nullable: true })
  _or?: BlockWhereParams[];
}

@InputType()
class BlockOrderByParams implements TOrderByParams<BlockDto> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_number?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_hash?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  parent_hash?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  total_events?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  timestamp?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  total_extrinsics?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  extrinsics_root?: GQLOrderByParamsArgs;
}

@ArgsType()
export class BlockQueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<BlockDto>
{
  @Field(() => BlockWhereParams, { nullable: true })
  where?: BlockWhereParams;

  @Field(() => BlockOrderByParams, { nullable: true })
  order_by?: BlockOrderByParams;
}

@ObjectType()
export class BlockDataResponse extends ListDataType(BlockDto) {}
