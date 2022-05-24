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
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { HolderDTO } from './holder.dto';
import { HolderService } from './holder.service';

@InputType()
class HolderWhereParams implements TWhereParams<HolderDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;
}

@InputType()
class HolderOrderByParams implements TOrderByParams<HolderDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;
}

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

  @Query(() => [HolderDTO])
  public async holders(@Args() args: QueryArgs): Promise<HolderDTO[]> {
    return this.service.find(args);
  }
}
