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
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsString,
  IDataListResponse,
  IGQLQueryArgs,
  ListDataType,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { AccountDTO } from './account.dto';
import { AccountService } from './account.service';

@InputType()
class AccountWhereParams implements TWhereParams<AccountDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  account_id?: GQLWhereOpsString;

  @Field(() => [AccountWhereParams], { nullable: true })
  _and?: AccountWhereParams[];

  @Field(() => [AccountWhereParams], { nullable: true })
  _or?: AccountWhereParams[];
}

@InputType()
class AccountOrderByParams implements TOrderByParams<AccountDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  account_id?: GQLOrderByParamsArgs;
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
}
