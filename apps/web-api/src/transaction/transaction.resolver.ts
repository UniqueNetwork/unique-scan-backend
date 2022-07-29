import { Args, Query, Resolver, ObjectType, ArgsType } from '@nestjs/graphql';
import {
  GQLQueryPaginationArgs,
  IDataListResponse,
  IGQLQueryArgs,
  ListDataType,
} from '../utils/gql-query-args';
import { TransactionDTO } from './transaction.dto';
import { TransactionService } from './transaction.service';

@ObjectType()
class TransactionsDataResponse extends ListDataType(TransactionDTO) {}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TransactionDTO> {
  // @Field(() => HolderWhereParams, { nullable: true })
  // where?: HolderWhereParams;
  // @Field(() => HolderOrderByParams, { nullable: true })
  // order_by?: HolderOrderByParams;
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
