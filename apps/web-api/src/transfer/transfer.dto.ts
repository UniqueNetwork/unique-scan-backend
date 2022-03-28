import { Event } from '@entities/Event';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('transfer')
export class TransferDTO implements Partial<Event> {
  @Field(() => String)
  block_index?: string;

  @Field(() => String)
  section?: string;

  @Field(() => String)
  method?: string;

  @Field(() => String)
  data?: string;
}
