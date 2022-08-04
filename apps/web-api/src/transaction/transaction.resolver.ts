import { Args, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse } from '../utils/gql-query-args';
import { TransactionDTO } from './transaction.dto';
import {
  QueryArgs,
  TransactionsDataResponse,
} from './transaction.resolver.types';
import { TransactionService } from './transaction.service';

@Resolver(() => TransactionDTO)
export class TransactionResolver {
  constructor(private service: TransactionService) {}

  @Query(() => TransactionsDataResponse)
  public async tokenTransactions(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<TransactionDTO>> {
    return this.service.findTokenTransactions(args);
  }
}
