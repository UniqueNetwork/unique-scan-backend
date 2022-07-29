import {
  Args,
  Query,
  Resolver,
  ObjectType,
  ArgsType,
  Field,
  InputType,
} from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  IDataListResponse,
  IGQLQueryArgs,
  ListDataType,
  TOrderByParams,
} from '../utils/gql-query-args';
import { TransactionDTO } from './transaction.dto';
import { TransactionService } from './transaction.service';

@ObjectType()
class TransactionsDataResponse extends ListDataType(TransactionDTO) {}

@InputType()
export class TransactionsOrderByParams
  implements TOrderByParams<TransactionDTO>
{
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  timestamp?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_index?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TransactionDTO>
{
  @Field(() => TransactionsOrderByParams, { nullable: true })
  order_by?: TransactionsOrderByParams;
}

@Resolver(() => TransactionDTO)
export class TransactionResolver {
  constructor(private service: TransactionService) {}

  @Query(() => TransactionsDataResponse)
  public async token_transactions(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<TransactionDTO>> {
    return this.service.find_token_transactions(args);
  }
}
