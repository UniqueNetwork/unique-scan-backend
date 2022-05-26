import {
  Args,
  ArgsType,
  Field,
  InputType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLQueryPaginationArgs,
  GQLWhereOpsString,
  IGQLQueryArgs,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { TransferDTO } from './transfer.dto';
import { TransferService } from './transfer.service';

@InputType()
class TransferWhereParams implements TWhereParams<TransferDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  block_index: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  section?: GQLWhereOpsString;
}

@InputType()
class TransferOrderByParams implements TOrderByParams<TransferDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_index: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  section?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TransferDTO>
{
  @Field(() => TransferWhereParams, { nullable: true })
  where?: TransferWhereParams;

  @Field(() => TransferOrderByParams, { nullable: true })
  order_by?: TransferOrderByParams;
}

@Resolver(() => [TransferDTO])
export class TransferResolver {
  constructor(private service: TransferService) {}

  @Query(() => [TransferDTO])
  public async transfers(@Args() args: QueryArgs): Promise<TransferDTO[]> {
    return this.service.find(args);
  }
}
