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
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
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

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<HolderDTO>
{
  @Field(() => HolderWhereParams, { nullable: true })
  where?: HolderWhereParams;
}

@Resolver(() => HolderDTO)
export class HolderResolver {
  constructor(private service: HolderService) {}

  @Query(() => [HolderDTO])
  public async holders(@Args() args: QueryArgs): Promise<HolderDTO[]> {
    return this.service.find(args);
  }
}
