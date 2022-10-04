import { Field, Int, ObjectType } from '@nestjs/graphql';

export class AttributeSingleDTO {}

@ObjectType('attribute')
export class AttributeDTO {
  @Field(() => String)
  key?: string;

  @Field(() => String)
  name?: string;

  @Field(() => String)
  value?: string;

  @Field(() => String)
  raw_value?: string;

  @Field(() => Int)
  tokens_count?: number;
}
