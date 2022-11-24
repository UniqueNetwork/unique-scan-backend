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
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IDataListResponse,
  IGQLQueryArgs,
  ListDataType,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { EvmTransactionDTO } from './evm-transaction.dto';
import { EvmTransactionService } from './evm-transaction.service';

@InputType()
class EvmTransactionWhereParams implements TWhereParams<EvmTransactionDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  from?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  to?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  block_number?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  block_hash?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  transaction_hash?: GQLWhereOpsString;

  @Field(() => [EvmTransactionWhereParams], { nullable: true })
  _and?: EvmTransactionWhereParams[];

  @Field(() => [EvmTransactionWhereParams], { nullable: true })
  _or?: EvmTransactionWhereParams[];
}

@InputType()
class EvmTransactionOrderByParams implements TOrderByParams<EvmTransactionDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_number?: GQLOrderByParamsArgs;
}

@ObjectType()
class EmvTransactionDataResponse extends ListDataType(EvmTransactionDTO) {}

@ArgsType()
export class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<EvmTransactionDTO>
{
  @Field(() => EvmTransactionWhereParams, { nullable: true })
  where?: EvmTransactionWhereParams;

  @Field(() => EvmTransactionOrderByParams, { nullable: true })
  order_by?: EvmTransactionOrderByParams;
}

@Resolver(() => EvmTransactionDTO)
export class EvmTransactionResolver {
  constructor(private service: EvmTransactionService) {}

  @Query(() => EmvTransactionDataResponse)
  public async evmTransactions(
    @Args() args: QueryArgs,
    @Info() info,
  ): Promise<IDataListResponse<EvmTransactionDTO>> {
    return this.service.find(args, info);
  }
}
