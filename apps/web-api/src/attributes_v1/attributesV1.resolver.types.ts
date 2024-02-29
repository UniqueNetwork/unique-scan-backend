import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  GQLOrderByParamsArgs,
  GQLWhereOpsIntEq,
  ListDataType,
  TOrderByParams,
} from '../utils/gql-query-args';
import { AttributeV1DTO } from './attributeV1DTO';

@InputType()
export class AttributesV1WhereParams {
  @Field(() => GQLWhereOpsIntEq)
  collection_id: GQLWhereOpsIntEq;
}

@InputType()
export class AttributesV1OrderByParams
  implements TOrderByParams<AttributeV1DTO>
{
  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  key?: GQLOrderByParamsArgs;

  @Field(() => GQLOrderByParamsArgs, { nullable: true })
  name?: GQLOrderByParamsArgs;
}

@ArgsType()
export class AttributesV1QueryArgs {
  @Field(() => AttributesV1WhereParams)
  where: AttributesV1WhereParams;

  @Field(() => AttributesV1OrderByParams, { nullable: true })
  order_by?: AttributesV1OrderByParams;
}

@ObjectType()
export class AttributesV1DataResponse extends ListDataType(AttributeV1DTO) {}
