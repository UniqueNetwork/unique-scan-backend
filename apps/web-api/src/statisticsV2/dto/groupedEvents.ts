import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import {
  GroupedEventsInput,
  GroupedEventsResponseItem,
  GroupedEventsResponse,
  TimestampType,
  GroupByInterval,
} from '../types';

@ArgsType()
export class GroupedEventsInputDto implements Partial<GroupedEventsInput> {
  @Field(() => Number, { nullable: true })
  from?: number;

  @Field(() => Number, { nullable: true })
  to?: number;

  @Field(() => TimestampType, { nullable: true })
  timestampType?: TimestampType;

  @Field(() => GroupByInterval, { nullable: true })
  groupByInterval?: GroupByInterval;

  @Field(() => [String], { nullable: true })
  methodIn?: string[];

  @Field(() => [String], { nullable: true })
  methodNotIn?: string[];

  @Field(() => [String], { nullable: true })
  sectionIn?: string[];

  @Field(() => [String], { nullable: true })
  sectionNotIn: string[];
}

@ObjectType()
export class GroupedEventsResponseItemDto implements GroupedEventsResponseItem {
  @Field(() => Number)
  intervalTimestamp: number;

  @Field(() => Number)
  count: number;
}

@ObjectType()
export class GroupedEventsResponseDto implements GroupedEventsResponse {
  @Field(() => [GroupedEventsResponseItemDto])
  items: GroupedEventsResponseItem[];

  @Field(() => TimestampType)
  timestampType: TimestampType;

  @Field(() => GroupByInterval)
  groupByInterval: GroupByInterval;
}
