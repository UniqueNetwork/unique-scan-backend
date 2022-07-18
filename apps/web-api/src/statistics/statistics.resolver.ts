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
import { StatisticsDTO } from './statistics.dto';
import { StatisticsService } from './statistics.service';

@InputType()
class StatisticsWhereParams implements TWhereParams<StatisticsDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  name?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  count?: GQLWhereOpsInt;

  @Field(() => [StatisticsWhereParams], { nullable: true })
  _and?: StatisticsWhereParams[];

  @Field(() => [StatisticsWhereParams], { nullable: true })
  _or?: StatisticsWhereParams[];
}

@InputType()
class StatisticsOrderByParams implements TOrderByParams<StatisticsDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  name?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  count?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<StatisticsDTO>
{
  @Field(() => StatisticsWhereParams, { nullable: true })
  where?: StatisticsWhereParams;

  @Field(() => StatisticsOrderByParams, { nullable: true })
  order_by?: StatisticsOrderByParams;
}

@ObjectType()
class StatisticsDataResponse extends ListDataType(StatisticsDTO) {}

@Resolver(() => StatisticsDTO)
export class StatisticsResolver {
  constructor(private service: StatisticsService) {}

  @Query(() => StatisticsDataResponse)
  public async statistics(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<StatisticsDTO>> {
    return this.service.find(args);
  }
}
