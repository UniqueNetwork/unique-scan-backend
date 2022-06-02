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
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IDataListResponse,
  IGQLQueryArgs,
  ListDataType,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { ExtrinsicDTO } from './extrinsic.dto';
import { ExtrinsicService } from './extrinsic.service';

@InputType()
class ExtrinsicWhereParams implements TWhereParams<ExtrinsicDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  block_index?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  block_number?: GQLWhereOpsString;

  @Field(() => [ExtrinsicWhereParams], { nullable: true })
  _or?: ExtrinsicWhereParams[];

  @Field(() => GQLWhereOpsString, { nullable: true })
  method?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  amount?: GQLWhereOpsInt;

  @Field(() => ExtrinsicWhereParams, { nullable: true })
  _and?: ExtrinsicWhereParams;
}

@InputType()
class ExtrinsicOrderByParams implements TOrderByParams<ExtrinsicDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_index?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_number?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  timestamp?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<ExtrinsicDTO>
{
  @Field(() => ExtrinsicWhereParams, { nullable: true })
  where?: ExtrinsicWhereParams;

  @Field(() => ExtrinsicOrderByParams, { nullable: true })
  order_by?: ExtrinsicOrderByParams;
}

@ObjectType()
class ExtrinsicDataResponse extends ListDataType(ExtrinsicDTO) {}

@Resolver(() => ExtrinsicDTO)
export class ExtrinsicResolver {
  constructor(private service: ExtrinsicService) {}

  @Query(() => ExtrinsicDataResponse)
  public async extrinsics(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<ExtrinsicDTO>> {
    return this.service.find(args);
  }
}
