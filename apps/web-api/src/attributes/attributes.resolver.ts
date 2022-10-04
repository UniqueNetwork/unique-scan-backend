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
  GQLWhereOpsIntEq,
  GQLWhereOpsString,
  IDataListResponse,
  IGQLQueryArgs,
  ListDataType,
  TOrderByParams,
  TWhereParams,
} from '../utils/gql-query-args';
import { AttributeDTO } from './attribute.dto';
import { AttributesService } from './attributes.service';

export type AttributesTWhere<T> = TWhereParams<T> & {
  collection_id: GQLWhereOpsIntEq;
};

@InputType()
class AttributesWhereParams implements AttributesTWhere<AttributeDTO> {
  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id: GQLWhereOpsIntEq;

  @Field(() => GQLWhereOpsString, { nullable: true })
  name?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  value?: GQLWhereOpsString;

  @Field(() => [AttributesWhereParams], { nullable: true })
  _and?: AttributesWhereParams[];

  @Field(() => [AttributesWhereParams], { nullable: true })
  _or?: AttributesWhereParams[];
}

@InputType()
class AttributesOrderByParams implements TOrderByParams<AttributeDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  key?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  name?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  value?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  raw_value?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  tokens_count?: GQLOrderByParamsArgs;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<AttributeDTO>
{
  @Field(() => AttributesWhereParams, { nullable: true })
  where?: AttributesWhereParams;

  @Field(() => AttributesOrderByParams, { nullable: true })
  order_by?: AttributesOrderByParams;
}

@ObjectType()
class AttributesDataResponse extends ListDataType(AttributeDTO) {}

@Resolver(() => AttributeDTO)
export class AttributesResolver {
  constructor(private service: AttributesService) {}

  @Query(() => AttributesDataResponse)
  public async attributes(
    @Args() args: QueryArgs,
  ): Promise<IDataListResponse<AttributeDTO>> {
    // @ts-ignore
    return this.service.getCollectionAttributes(args);
  }
}
