import { EventMethod } from '@common/constants';
import { TokenType } from '@entities/Tokens';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('token_event')
export class TokenEventDTO {
  @Field(() => String)
  action:
    | EventMethod.ITEM_CREATED
    | EventMethod.TRANSFER
    | EventMethod.ITEM_DESTROYED;

  @Field(() => Float)
  timestamp?: string;

  @Field(() => Float, { nullable: true })
  fee?: string;

  @Field(() => String, { nullable: true })
  author?: string;

  @Field(() => Boolean, { nullable: true })
  result?: boolean;

  @Field(() => Int)
  collection_id?: number;

  @Field(() => Int, { nullable: true })
  token_id?: number;

  @Field(() => GraphQLJSONObject, { nullable: true })
  values?: object;

  @Field(() => GraphQLJSON, { nullable: true })
  data?: object[];

  @Field(() => GraphQLJSON, { nullable: true })
  tokens?: object[];

  @Field(() => TokenType, { nullable: true })
  type?: TokenType;

  @Field(() => String, { nullable: true })
  token_name?: string;
}
