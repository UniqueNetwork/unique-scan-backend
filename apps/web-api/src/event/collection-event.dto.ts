import { EventMethod } from '@common/constants';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('collection_event')
export class CollectionEventDTO {
  @Field(() => Int)
  collection_id?: number;

  @Field(() => String)
  action: EventMethod;

  @Field(() => Int)
  timestamp?: string;

  @Field(() => Float, { nullable: true })
  fee?: string;

  @Field(() => String, { nullable: true })
  author?: string;

  @Field(() => Boolean)
  result?: boolean;
}
