import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('attribute_value')
class AttributeValue {
  @Field(() => String, { nullable: true })
  value?: string;

  @Field(() => String, { nullable: true })
  raw_value?: string;

  @Field(() => Int, { nullable: true })
  tokens_count?: number;
}

@ObjectType('attribute')
export class AttributeDTO {
  @Field(() => String)
  key?: string;

  @Field(() => String)
  name?: string;

  @Field(() => [AttributeValue])
  values?: AttributeValue[];
}
