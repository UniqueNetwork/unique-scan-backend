import { Field, ObjectType } from '@nestjs/graphql';
import { AllEventsResponseItem, AllEventsResponse } from '../types';

@ObjectType()
export class AllEventsResponseItemDto implements AllEventsResponseItem {
  @Field(() => String)
  section: string;

  @Field(() => String)
  method: string;

  @Field(() => Number)
  count: number;
}

@ObjectType()
export class AllEventsResponseDto implements AllEventsResponse {
  @Field(() => [AllEventsResponseItemDto])
  items: AllEventsResponseItem[];
}
