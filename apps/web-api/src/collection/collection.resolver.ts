import {
  Args,
  ArgsType,
  Field,
  InputType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { GraphQLEnumType, isEnumType, __EnumValue } from 'graphql';
import {
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  IOrderByOperators,
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
class CollectionOrderByParams {
  @Field(() => String, { nullable: true})
  collection_id?: IOrderByOperators;
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
