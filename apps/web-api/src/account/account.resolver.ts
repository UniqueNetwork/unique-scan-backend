import {
  Args,
  ArgsType,
  Field,
  InputType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  GQLQueryPaginationArgs,
  GQLWhereOpsString,
  IGQLQueryArgs,
  TWhereParams,
} from '../utils/gql-query-args';
import { AccountDTO } from './account.dto';
import { AccountService } from './account.service';

@InputType()
class AccountWhereParams implements TWhereParams<AccountDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  account_id?: GQLWhereOpsString;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<AccountDTO>
{
  @Field(() => AccountWhereParams, { nullable: true })
  where?: AccountWhereParams;
}

@Resolver(() => AccountDTO)
export class AccountResolver {
  constructor(private service: AccountService) {}

  @Query(() => [AccountDTO])
  public async accounts(@Args() args: QueryArgs): Promise<AccountDTO[]> {
    return this.service.find(args);
  }
}
