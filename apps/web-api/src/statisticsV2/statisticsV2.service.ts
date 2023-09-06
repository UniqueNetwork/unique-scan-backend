import { CACHE_MANAGER, Inject, Injectable, CacheStore } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SentryWrapper } from '../utils/sentry.decorator';
import { BlockNumbersInputDto, GroupedEventsInputDto } from './dto';
import {
  AllEventsResponse,
  BlockNumbersResponse,
  GroupedEventsInput,
  GroupedEventsResponse,
  GroupedEventsResponseItem,
} from './types';
import {
  dateToTimestamp,
  fillGroupedEventsInput,
  fillTimeBounds,
} from './utils';
import { StatisticsV2Repository } from './statisticsV2.repository';

const CACHE_TTL = 12;
const CACHE_ALL_EVENTS_KEY = 'allEvents';
const CACHE_ALL_EXTRINSICS_KEY = 'allExtrinsics';

@Injectable()
export class StatisticsV2Service {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly statisticsV2Repository: StatisticsV2Repository,
    @Inject(CACHE_MANAGER) readonly cache: CacheStore,
  ) {}

  @SentryWrapper({
    // todo
  })
  public async getBlockNumbers(
    blockNumbersInput: BlockNumbersInputDto,
  ): Promise<BlockNumbersResponse> {
    const args = fillTimeBounds(blockNumbersInput);

    const rawItems = await this.statisticsV2Repository.getBlockNumbers(args);

    const items = rawItems.map((item) => ({
      firstBlockNumber: item.first_block_number,
      lastBlockNumber: item.last_block_number,
      intervalTimestamp: dateToTimestamp(
        args.timestampType,
        item.interval_timestamp_date,
      ),
    }));

    return {
      items: items,
      groupByInterval: args.groupByInterval,
      timestampType: args.timestampType,
    };
  }

  @SentryWrapper({
    // todo
  })
  public async getAllEvents(): Promise<AllEventsResponse> {
    const fn = () =>
      this.statisticsV2Repository.countAllEvents().then((items) => ({ items }));

    return this.withCache(CACHE_ALL_EVENTS_KEY, fn);
  }

  @SentryWrapper({
    // todo
  })
  public async getAllExtrinsics(): Promise<AllEventsResponse> {
    const fn = () =>
      this.statisticsV2Repository
        .countAllExtrinsics()
        .then((items) => ({ items }));

    return this.withCache(CACHE_ALL_EXTRINSICS_KEY, fn);
  }

  async getEventsGroupedByInterval(
    groupedEventsInput: GroupedEventsInputDto,
  ): Promise<GroupedEventsResponse> {
    const args = fillGroupedEventsInput(groupedEventsInput);
    const rawItems = await this.statisticsV2Repository.countGroupedEvents(args);

    const items = rawItems.map((item) => ({
      intervalTimestamp: dateToTimestamp(
        args.timestampType,
        item.interval_timestamp,
      ),
      count: parseInt(item.event_count, 10),
    }));

    return {
      items,
      groupByInterval: args.groupByInterval,
      timestampType: args.timestampType,
    };
  }

  private async withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const cached = await this.cache.get<T>(key);

    if (cached) {
      return cached;
    }

    const result = await fn();

    await this.cache.set(key, result, { ttl: CACHE_TTL });

    return result;
  }
}
