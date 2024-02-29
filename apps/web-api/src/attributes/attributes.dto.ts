import { Field, Int, ObjectType, FieldMiddleware } from '@nestjs/graphql';

@ObjectType('attribute')
export class AttributesDto {
  @Field(() => Int)
  collection_id?: number;

  @Field(() => Int)
  token_id?: number;

  @Field(() => String)
  trait_type?: string;

  @Field(() => String, { nullable: true })
  display_type?: string;

  @Field(() => String, { nullable: true })
  value_string?: string | null;

  @Field(() => Number, { nullable: true })
  value_number?: number | null;
}
