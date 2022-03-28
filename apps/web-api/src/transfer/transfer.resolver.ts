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
import { TransferDTO } from './transfer.dto';
import { TransferService } from './transfer.service';

@InputType()
class TransferWhereParams implements TWhereParams<TransferDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  block_index: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  section?: GQLWhereOpsString;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<TransferDTO>
{
  @Field(() => TransferWhereParams, { nullable: true })
  where?: TransferWhereParams;
}

@Resolver(() => [TransferDTO])
export class TransferResolver {
  constructor(private service: TransferService) {}

  @Query(() => [TransferDTO])
  public async transfers(@Args() args: QueryArgs): Promise<TransferDTO[]> {
    return this.service.find(args);
  }
}
