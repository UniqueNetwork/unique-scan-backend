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
  IOrderByParams,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { CollectionDTO } from './collection.dto';
import { CollectionService } from './collection.service';

@InputType()
class CollectionWhereParams implements TWhereParams<CollectionDTO> {
  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  description?: GQLWhereOpsString;
}

@InputType()
class CollectionOrderByParams implements TOrderByParams<CollectionDTO> {
  @Field(() => IOrderByParams, { nullable: true })
  collection_id?: IOrderByParams;

  @Field(() => IOrderByParams, { nullable: true })
  owner?: IOrderByParams;

  @Field(() => IOrderByParams, { nullable: true })
  description?: IOrderByParams;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<CollectionDTO>
{
  @Field(() => CollectionWhereParams, { nullable: true })
  where?: CollectionWhereParams;

  @Field(() => CollectionOrderByParams, { nullable: true })
  order_by?: CollectionOrderByParams;
}

@Resolver(() => CollectionDTO)
export class CollectionResolver {
  constructor(private service: CollectionService) {}

  @Query(() => [CollectionDTO])
  public async collections(@Args() args: QueryArgs): Promise<CollectionDTO[]> {
    return this.service.find(args);
  }
}
