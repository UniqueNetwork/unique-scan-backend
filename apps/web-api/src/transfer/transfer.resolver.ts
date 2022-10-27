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
import { TransferDTO } from './transfer.dto';
import { TransferService } from './transfer.service';

@InputType()
class TransferWhereParams implements TWhereParams<TransferDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  block_index: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  section?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  method?: GQLWhereOpsString;

  @Field(() => [TransferWhereParams], { nullable: true })
  _and?: TransferWhereParams[];

  @Field(() => [TransferWhereParams], { nullable: true })
  _or?: TransferWhereParams[];
}

@InputType()
class TransferOrderByParams implements TOrderByParams<TransferDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_index: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  section?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  method?: GQLOrderByParamsArgs;
}

@ObjectType()
class TransferDataResponse extends ListDataType(TransferDTO) {}

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

  @Query(() => TransferDataResponse)
  public async transfers(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<TransferDTO>> {
    return this.service.find(args);
  }
}
