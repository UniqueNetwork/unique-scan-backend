import { Tokens } from '@entities/Tokens';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('token')
export class TokenDTO implements Partial<Tokens> {
  @Field(() => Int)
  token_id?: number;

  @Field(() => Int)
  collection_id?: number;

  @Field(() => GraphQLJSONObject)
  data?: object;

  @Field(() => String)
  owner?: string;

  @Field(() => String)
  owner_normalized?: string;

  @Field(() => String)
  image_path?: string;

  @Field(() => String)
  token_prefix?: string;

  @Field(() => String)
  collection_name?: string;

  @Field(() => String)
  collection_description?: string;

  @Field(() => String, { nullable: true })
  collection_cover?: string;

  @Field(() => Int, { nullable: true })
  date_of_creation?: number;
}
