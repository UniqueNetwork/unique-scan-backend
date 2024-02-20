import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import {
  BlockNumbersInput,
  BlockNumbersResponse,
  TimestampType,
  GroupByInterval,
  BlockNumbersResponseItem,
} from '../types';

@ArgsType()
export class BlockNumbersInputDto implements Partial<BlockNumbersInput> {
  @Field(() => Number, { nullable: true })
  from?: number;

  @Field(() => Number, { nullable: true })
  to?: number;

  @Field(() => TimestampType, { nullable: true })
  timestampType?: TimestampType;

  @Field(() => GroupByInterval, { nullable: true })
  groupByInterval?: GroupByInterval;
}

@ObjectType()
export class BlockNumbersResponseItemDto implements BlockNumbersResponseItem {
  @Field(() => Number)
  firstBlockNumber: number;

  @Field(() => Number)
  lastBlockNumber: number;

  @Field(() => Number)
  intervalTimestamp: number;
}

@ObjectType()
export class BlockNumbersResponseDto implements BlockNumbersResponse {
  @Field(() => [BlockNumbersResponseItemDto])
  items: BlockNumbersResponseItem[];

  @Field(() => TimestampType)
  timestampType: TimestampType;

  @Field(() => GroupByInterval)
  groupByInterval: GroupByInterval;
}
