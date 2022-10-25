import { EventMethod } from '@common/constants';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('token_event')
export class TokenEventDTO {
  @Field(() => String)
  action:
    | EventMethod.ITEM_CREATED
    | EventMethod.TRANSFER
    | EventMethod.ITEM_DESTROYED;

  @Field(() => Int)
  timestamp?: string;

  @Field(() => Float)
  fee?: string;

  @Field(() => String, { nullable: true })
  author?: string;

  @Field(() => Boolean)
  result?: boolean;

  @Field(() => Int)
  collection_id?: number;

  @Field(() => Int)
  token_id?: number;
}
