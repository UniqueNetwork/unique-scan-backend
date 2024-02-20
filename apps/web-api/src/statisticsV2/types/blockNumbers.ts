import { GroupByInterval, TimeBounds, TimestampType } from './shared';

// eslint-disable-next-line
export interface BlockNumbersInput extends TimeBounds {}

export interface BlockNumbersResponseItem {
  firstBlockNumber: number;
  lastBlockNumber: number;
  intervalTimestamp: number;
}

export interface BlockNumbersResponse {
  items: BlockNumbersResponseItem[];
  timestampType: TimestampType;
  groupByInterval: GroupByInterval;
}
