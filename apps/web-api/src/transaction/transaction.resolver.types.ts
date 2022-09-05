import { ObjectType, ArgsType, Field, InputType } from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsString,
  IGQLQueryArgs,
  ListDataType,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { TransactionDTO } from './transaction.dto';

@ObjectType()
export class TransactionsDataResponse extends ListDataType(TransactionDTO) {}

@InputType()
export class TransactionsOrderByParams
  implements TOrderByParams<TransactionDTO>
{
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  timestamp?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_index?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner_normalized?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  to_owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  to_owner_normalized?: GQLOrderByParamsArgs;
}

@InputType()
class TransactionWhereParams implements TWhereParams<TransactionDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  block_index?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  to_owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  to_owner_normalized?: GQLWhereOpsString;

  @Field(() => [TransactionWhereParams], { nullable: true })
  _and?: TransactionWhereParams[];

  @Field(() => [TransactionWhereParams], { nullable: true })
  _or?: TransactionWhereParams[];
}

@ArgsType()
export class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TransactionDTO>
{
  @Field(() => TransactionsOrderByParams, { nullable: true })
  order_by?: TransactionsOrderByParams;

  @Field(() => TransactionWhereParams, { nullable: true })
  where?: TransactionWhereParams;
}
