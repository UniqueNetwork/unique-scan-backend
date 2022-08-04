import {
  Args,
  ArgsType,
  Field,
  InputType,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  DateRangeArgs,
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsString,
  IDataListResponse,
  IGQLQueryArgs,
  ListDataType,
  StatisticDataResponse,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { AccountDTO } from './account.dto';
import { AccountService } from './account.service';

@InputType()
class AccountWhereParams implements TWhereParams<AccountDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  account_id?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  account_id_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  balances?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  block_height?: GQLWhereOpsString;

  @Field(() => [AccountWhereParams], { nullable: true })
  _and?: AccountWhereParams[];

  @Field(() => [AccountWhereParams], { nullable: true })
  _or?: AccountWhereParams[];
}

@InputType()
class AccountOrderByParams implements TOrderByParams<AccountDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  account_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  balances?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  timestamp?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  available_balance?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  free_balance?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_height?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  locked_balance?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<AccountDTO>
{
  @Field(() => AccountWhereParams, { nullable: true })
  where?: AccountWhereParams;

  @Field(() => AccountOrderByParams, { nullable: true })
  order_by?: AccountOrderByParams;
}

@ObjectType()
class AccountDataResponse extends ListDataType(AccountDTO) {}

@Resolver(() => AccountDTO)
export class AccountResolver {
  constructor(private service: AccountService) {}

  @Query(() => AccountDataResponse)
  public async accounts(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<AccountDTO>> {
    return this.service.find(args);
  }

  @Query(() => StatisticDataResponse)
  public async accountsStatistics(
    @Args() args: DateRangeArgs,
  ): Promise<StatisticDataResponse> {
    const data = await this.service.statistic(args);
    return { data };
  }
}
