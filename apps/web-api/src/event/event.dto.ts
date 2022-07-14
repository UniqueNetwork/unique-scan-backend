import { Event } from '@entities/Event';
import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType('event')
export class EventDTO implements Partial<Event> {
  @Field(() => String, { nullable: true })
  block_index?: string;

  @Field(() => String)
  block_number?: number;

  @Field(() => Float, { nullable: true })
  amount?: string;

  @Field(() => Float)
  fee?: string;
}
