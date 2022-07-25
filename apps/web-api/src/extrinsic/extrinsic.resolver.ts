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
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IDataListResponse,
  IGQLQueryArgs,
  ListDataType,
  StatisticDataResponse,
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

  @Field(() => GQLWhereOpsString, { nullable: true })
  method?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  amount?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  from_owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  from_owner_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  to_owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  to_owner_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  fee?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  section?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  timestamp?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  hash?: GQLWhereOpsString;

  @Field(() => [ExtrinsicWhereParams], { nullable: true })
  _and?: ExtrinsicWhereParams[];

  @Field(() => [ExtrinsicWhereParams], { nullable: true })
  _or?: ExtrinsicWhereParams[];
}

@InputType()
class ExtrinsicOrderByParams implements TOrderByParams<ExtrinsicDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_index?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  block_number?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  from_owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  amount?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  from_owner_normalized?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  to_owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  to_owner_normalized?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  fee?: GQLOrderByParamsArgs;

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

  @Query(() => StatisticDataResponse)
  public async extrinsicsStatistics(
    @Args() args: DateRangeArgs,
  ): Promise<StatisticDataResponse> {
    const data = await this.service.statistic(args);
    return { data };
  }
}
