import { Event } from '@entities/Event';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('event')
export class EventDTO implements Partial<Event> {
  @Field(() => String, { nullable: true })
  block_index?: string;

  @Field(() => String)
  method?: string;

  @Field(() => String)
  section?: string;

  @Field(() => String)
  block_number?: string;

  @Field(() => Float, { nullable: true })
  amount?: string;

  @Field(() => Float)
  fee?: string;

  @Field(() => Int, { nullable: true })
  collection_id?: number;

  @Field(() => Int, { nullable: true })
  token_id?: number;
}
