import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('attribute_value')
export class AttributeValue {
  @Field(() => GraphQLJSONObject, { nullable: true })
  value?: object;

  @Field(() => String, { nullable: true })
  raw_value?: string; // Stringified attribute rawValue

  @Field(() => Int, { nullable: true })
  tokens_count?: number;
}

@ObjectType('attribute')
export class AttributeDTO {
  @Field(() => String)
  key?: string;

  @Field(() => GraphQLJSONObject)
  name?: string | object;

  @Field(() => [AttributeValue])
  values?: AttributeValue[];
}
