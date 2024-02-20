import { GroupByInterval, TimeBounds, TimestampType } from './shared';

export interface GroupedEventsInput extends TimeBounds {
  sectionIn: string[];
  sectionNotIn: string[];

  methodIn: string[];
  methodNotIn: string[];
}

export interface GroupedEventsResponseItem {
  intervalTimestamp: number;
  count: number;
}

export interface GroupedEventsResponse {
  items: GroupedEventsResponseItem[];
  timestampType: TimestampType;
  groupByInterval: GroupByInterval;
}
