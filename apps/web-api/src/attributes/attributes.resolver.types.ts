import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLWhereOpsIntEq,
  ListDataType,
  TOrderByParams,
} from '../utils/gql-query-args';
import { AttributeDTO } from './attribute.dto';

@InputType()
export class AttributesWhereParams {
  @Field(() => GQLWhereOpsIntEq)
  collection_id: GQLWhereOpsIntEq;
}

@InputType()
export class AttributesOrderByParams implements TOrderByParams<AttributeDTO> {
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  key?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  name?: GQLOrderByParamsArgs;
}

@ArgsType()
export class AttributesQueryArgs {
  @Field(() => AttributesWhereParams)
  where: AttributesWhereParams;

  @Field(() => AttributesOrderByParams, { nullable: true })
  order_by?: AttributesOrderByParams;
}

@ObjectType()
export class AttributesDataResponse extends ListDataType(AttributeDTO) {}
