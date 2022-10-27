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
import { HolderDTO } from './holder.dto';
import { HolderService } from './holder.service';

@InputType()
class HolderWhereParams implements TWhereParams<HolderDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner_normalized?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => [HolderWhereParams], { nullable: true })
  _and?: HolderWhereParams[];

  @Field(() => [HolderWhereParams], { nullable: true })
  _or?: HolderWhereParams[];
}

@InputType()
class HolderOrderByParams implements TOrderByParams<HolderDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner_normalized?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  count?: GQLOrderByParamsArgs;
}

@ObjectType()
class HolderDataResponse extends ListDataType(HolderDTO) {}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<HolderDTO>
{
  @Field(() => HolderWhereParams, { nullable: true })
  where?: HolderWhereParams;

  @Field(() => HolderOrderByParams, { nullable: true })
  order_by?: HolderOrderByParams;
}

@Resolver(() => HolderDTO)
export class HolderResolver {
  constructor(private service: HolderService) {}

  @Query(() => HolderDataResponse)
  public async holders(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<HolderDTO>> {
    return this.service.find(args);
  }
}
