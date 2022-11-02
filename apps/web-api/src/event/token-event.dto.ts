import { EventMethod } from '@common/constants';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('token_event')
export class TokenEventDTO {
  @Field(() => String)
  action:
    | EventMethod.ITEM_CREATED
    | EventMethod.TRANSFER
    | EventMethod.ITEM_DESTROYED;

  @Field(() => Int)
  timestamp?: string;

  @Field(() => Float, { nullable: true })
  fee?: string;

  @Field(() => String, { nullable: true })
  author?: string;

  @Field(() => Boolean)
  result?: boolean;

  @Field(() => Int)
  collection_id?: number;

  @Field(() => Int)
  token_id?: number;

  @Field(() => GraphQLJSONObject, { nullable: true })
  values?: object;
}
