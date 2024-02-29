import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('attribute_v1_value')
export class AttributeV1Value {
  @Field(() => GraphQLJSONObject, { nullable: true })
  value?: object;

  @Field(() => String, { nullable: true })
  raw_value?: string; // Stringified attribute rawValue

  @Field(() => Int, { nullable: true })
  tokens_count?: number;
}

@ObjectType('attribute_v1')
export class AttributeV1DTO {
  @Field(() => String)
  key?: string;

  @Field(() => GraphQLJSONObject)
  name?: string | object;

  @Field(() => [AttributeV1Value])
  values?: AttributeV1Value[];
}
