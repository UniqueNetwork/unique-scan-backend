import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
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

@InputType()
export class AttributesWhereParams {
  @Field(() => GQLWhereOpsInt, { nullable: true })
  collection_id: GQLWhereOpsIntEq;
}

@InputType()
export class AttributesOrderByParams implements TOrderByParams<AttributeDTO> {
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
export class AttributesQueryArgs {
  @Field(() => AttributesWhereParams, { nullable: true })
  where: AttributesWhereParams;

  @Field(() => AttributesOrderByParams, { nullable: true })
  order_by?: AttributesOrderByParams;
}

@ObjectType()
export class AttributesDataResponse extends ListDataType(AttributeDTO) {}
