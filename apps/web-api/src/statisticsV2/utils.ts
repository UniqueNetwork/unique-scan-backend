import {
  BlockNumbersInput,
  FromTo,
  GroupByInterval,
  GroupedEventsInput,
  TimeBounds,
  TimestampType,
} from './types';

const DEFAULT_GROUP_BY_INTERVAL = GroupByInterval.month;
const DEFAULT_TIMESTAMP_TYPE = TimestampType.MILLISECONDS;

const getNow = (timestampType: TimestampType): number => {
  return timestampType === TimestampType.MILLISECONDS
    ? Date.now()
    : Math.floor(Date.now() / 1000);
};

export const fillFromTo = (rawArgs: Partial<FromTo>): FromTo => {
  const { from = 0, timestampType = DEFAULT_TIMESTAMP_TYPE } = rawArgs;

  const to = rawArgs.to || getNow(timestampType);

  return { from, to, timestampType };
};

export const fillTimeBounds = (
  rawTimeBounds: Partial<TimeBounds>,
): TimeBounds => {
  const { groupByInterval = DEFAULT_GROUP_BY_INTERVAL } = rawTimeBounds;

  return { ...fillFromTo(rawTimeBounds), groupByInterval };
};

export const castFromToToMs = (rawFromTo: FromTo): FromTo => {
  if (rawFromTo.timestampType === TimestampType.MILLISECONDS) {
    return rawFromTo;
  }

  return {
    from: rawFromTo.from * 1000,
    to: rawFromTo.to * 1000,
    timestampType: TimestampType.MILLISECONDS,
  };
};

export const castTimeBoundsToMs = (
  raw: BlockNumbersInput,
): BlockNumbersInput => {
  return { ...castFromToToMs(raw), groupByInterval: raw.groupByInterval };
};

export const dateToTimestamp = (timestampType: TimestampType, date: Date) => {
  return timestampType === TimestampType.MILLISECONDS
    ? date.getTime()
    : Math.floor(date.getTime() / 1000);
};

export const fillGroupedEventsInput = (
  raw: Partial<GroupedEventsInput>,
): GroupedEventsInput => {
  return {
    ...fillTimeBounds(raw),
    sectionIn: raw.sectionIn || [],
    sectionNotIn: raw.sectionNotIn || [],
    methodIn: raw.methodIn || [],
    methodNotIn: raw.methodNotIn || [],
  };
};
