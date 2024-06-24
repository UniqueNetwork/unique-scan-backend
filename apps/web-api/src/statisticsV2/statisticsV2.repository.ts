import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AllEventsResponseItem,
  BlockNumbersInput,
  GroupedEventsInput,
} from './types';
import { castTimeBoundsToMs } from './utils';

type RawBlockNumbersResponseItem = {
  first_block_number: number;
  last_block_number: number;
  interval_timestamp_date: Date;
};

type RawGroupedEventsResponseItem = {
  interval_timestamp: Date;
  event_count: string;
};

type RawAllEventsResponseItem = {
  section: string;
  method: string;
  count: number;
};

const BLOCKS_TABLE = 'harvester_blocks';
const EVENTS_TABLE = 'harvester_events';
const EXTRINSICS_TABLE = 'harvester_extrinsics';

type EventsOrExtrinsicsTable = typeof EVENTS_TABLE | typeof EXTRINSICS_TABLE;

@Injectable()
export class StatisticsV2Repository {
  constructor(@InjectDataSource() readonly dataSource: DataSource) {}

  async getBlockNumbers(
    blockNumbersArgs: BlockNumbersInput,
  ): Promise<RawBlockNumbersResponseItem[]> {
    const { from, to, groupByInterval } = castTimeBoundsToMs(blockNumbersArgs);

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const truncatedColumn = `DATE_TRUNC('${groupByInterval}', "timestamp")`;

    const query = this.dataSource
      .createQueryBuilder()
      .select(`${truncatedColumn} as interval_timestamp_date`)
      .addSelect('MIN(hb.id)', 'first_block_number')
      .addSelect('MAX(hb.id)', 'last_block_number')
      .from(BLOCKS_TABLE, 'hb')
      .where(`hb.timestamp BETWEEN :fromDate AND :toDate`, { fromDate, toDate })
      .groupBy('interval_timestamp_date')
      .orderBy('interval_timestamp_date');

    return await query.getRawMany<RawBlockNumbersResponseItem>();
  }

  async countAllExtrinsics(): Promise<AllEventsResponseItem[]> {
    return await this.countAllSectionMethod(EXTRINSICS_TABLE);
  }

  async countAllEvents(): Promise<AllEventsResponseItem[]> {
    return await this.countAllSectionMethod(EVENTS_TABLE);
  }

  async countGroupedEvents(
    groupedEventsInput: GroupedEventsInput,
  ): Promise<RawGroupedEventsResponseItem[]> {
    return await this.countGroupedSectionMethod(
      groupedEventsInput,
      EVENTS_TABLE,
    );
  }

  async countGroupedExtrinsics(
    groupedEventsInput: GroupedEventsInput,
  ): Promise<RawGroupedEventsResponseItem[]> {
    return await this.countGroupedSectionMethod(
      groupedEventsInput,
      EXTRINSICS_TABLE,
    );
  }

  private async countGroupedSectionMethod(
    groupedEventsInput: GroupedEventsInput,
    table: EventsOrExtrinsicsTable,
  ): Promise<RawGroupedEventsResponseItem[]> {
    const {
      groupByInterval: interval,
      from,
      to,
      sectionIn,
      sectionNotIn,
      methodIn,
      methodNotIn,
    } = groupedEventsInput;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const query = this.dataSource
      .createQueryBuilder()
      .select(`interval_series.${interval}`, 'interval_timestamp')
      .addSelect('COALESCE(event_counts.event_count, 0)', 'event_count')
      .from((subQuery) => {
        subQuery
          .select(
            `generate_series(date_trunc('${interval}', min(hb.timestamp)),` +
              ` date_trunc('${interval}', max(hb.timestamp)), '1 ${interval}')`,
            interval,
          )
          .from(BLOCKS_TABLE, 'hb');

        return subQuery;
      }, 'interval_series')
      .leftJoin(
        (subQuery) => {
          subQuery
            .select(`date_trunc('${interval}', hb.timestamp) AS "${interval}"`)
            .addSelect('count(1) AS event_count')
            .from(BLOCKS_TABLE, 'hb')
            .leftJoin(table, 'he', 'hb.id = he."blockId"')
            .where(`hb.timestamp BETWEEN :fromDate AND :toDate`, {
              fromDate,
              toDate,
            });

          if (sectionIn.length) {
            subQuery.andWhere(`he."section" IN (:...sectionIn)`, { sectionIn });
          }

          if (sectionNotIn.length) {
            subQuery.andWhere(`he."section" NOT IN (:...sectionNotIn)`, {
              sectionNotIn,
            });
          }

          if (methodIn.length) {
            subQuery.andWhere(`he."method" IN (:...methodIn)`, { methodIn });
          }

          if (methodNotIn.length) {
            subQuery.andWhere(`he."method" NOT IN (:...methodNotIn)`, {
              methodNotIn,
            });
          }

          subQuery.groupBy(`"${interval}"`);

          return subQuery;
        },
        'event_counts',
        `interval_series.${interval} = event_counts."${interval}"`,
      )
      .orderBy(`interval_series.${interval}`, 'ASC');

    return await query.getRawMany<RawGroupedEventsResponseItem>();
  }

  private async countAllSectionMethod(
    table: EventsOrExtrinsicsTable,
  ): Promise<RawAllEventsResponseItem[]> {
    const query = this.dataSource
      .createQueryBuilder()
      .select('he.section', 'section')
      .addSelect('he.method', 'method')
      .addSelect('COUNT(1)', 'count')
      .from(table, 'he')
      .groupBy('he.section')
      .addGroupBy('he.method')
      .orderBy('he.section')
      .addOrderBy('he.method');

    return await query.getRawMany<AllEventsResponseItem>();
  }
}
