import { registerEnumType } from '@nestjs/graphql';

export enum TimestampType {
  UNIX = 'unix',
  MILLISECONDS = 'milliseconds',
}

registerEnumType(TimestampType, { name: 'TimestampTypeEnum' });

export enum GroupByInterval {
  hour = 'hour',
  day = 'day',
  week = 'week',
  month = 'month',
  year = 'year',
}

registerEnumType(GroupByInterval, { name: 'GroupByIntervalEnum' });

export interface FromTo {
  from: number;
  to: number;
  timestampType: TimestampType;
}

export interface TimeBounds extends FromTo {
  groupByInterval: GroupByInterval;
}
