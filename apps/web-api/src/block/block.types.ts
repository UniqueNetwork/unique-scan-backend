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
import { BlockDto, LastBlockDto } from './block.dto';

@InputType()
class LastBlockWhereParams implements TWhereParams<LastBlockDto> {
  @Field(() => GQLWhereOpsInt, { nullable: true })
  block_number?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  timestamp?: GQLWhereOpsInt;

  @Field(() => LastBlockWhereParams, { nullable: true })
  _and?: LastBlockWhereParams;
}

@InputType()
export class LastBlockOrderByParams implements TOrderByParams<LastBlockDto> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_number?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  timestamp?: GQLOrderByParamsArgs;
}

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

  @Field(() => BlockWhereParams, { nullable: true })
  _and?: BlockWhereParams;
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

@ArgsType()
export class LastBlockQueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<LastBlockDto>
{
  @Field(() => LastBlockWhereParams, { nullable: true })
  where?: LastBlockWhereParams;

  @Field(() => LastBlockOrderByParams, { nullable: true })
  order_by?: LastBlockOrderByParams;
}

@ObjectType()
export class LastBlockDataResponse extends ListDataType(LastBlockDto) {}

@ObjectType()
export class BlockDataResponse extends ListDataType(BlockDto) {}
