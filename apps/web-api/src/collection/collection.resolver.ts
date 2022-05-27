import {
  Args,
  ArgsType,
  Field,
  InputType,
  ObjectType,
  Query,
  registerEnumType,
  Resolver,
} from '@nestjs/graphql';
import {
  GQLQueryPaginationArgs,
  GQLWhereOpsInt,
  GQLWhereOpsString,
  IGQLQueryArgs,
  GQLOrderByParamsArgs,
  TOrderByParams,
  TWhereParams,
  IDataListResponse,
  ListDataType,
} from '../utils/gql-query-args';
import { CollectionDTO, CollectionEnum } from './collection.dto';
import { CollectionService } from './collection.service';

registerEnumType(CollectionEnum, { name: 'CollectionEnum' });

@InputType()
class CollectionWhereParams implements TWhereParams<CollectionDTO> {
  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id?: GQLWhereOpsInt;

  @Field(() => GQLWhereOpsString, { nullable: true })
  owner?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  description?: GQLWhereOpsString;

  @Field(() => CollectionWhereParams, { nullable: true })
  _and?: CollectionWhereParams;
}

@InputType()
class CollectionOrderByParams implements TOrderByParams<CollectionDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  collection_id?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  owner?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  description?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<CollectionDTO>
{
  @Field(() => CollectionEnum, { nullable: true })
  distinct_on?: CollectionEnum;

  @Field(() => CollectionWhereParams, { nullable: true })
  where?: CollectionWhereParams;

  @Field(() => CollectionOrderByParams, { nullable: true })
  order_by?: CollectionOrderByParams;
}

@ObjectType()
class CollectionDataResponse extends ListDataType(CollectionDTO) {}

@Resolver(() => CollectionDTO)
export class CollectionResolver {
  constructor(private service: CollectionService) {}

  @Query(() => CollectionDataResponse)
  public async collections(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<CollectionDTO>> {
    return this.service.find(args);
  }
}
