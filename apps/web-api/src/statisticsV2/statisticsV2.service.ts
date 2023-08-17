import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SentryWrapper } from '../utils/sentry.decorator';
import {
  FIRST_BLOCK_QUERY,
  LAST_BLOCK_QUERY,
  EXTRINSICS_STATISTICS_QUERY,
  TOKEN_TRANSFER_STATISTICS_QUERY,
  BALANCE_TRANSFER_STATISTICS_QUERY,
  COLLECTION_CREATED_STATISTICS_QUERY,
  TOKEN_CREATED_STATISTICS_QUERY,
  NEW_ACCOUNT_STATISTICS_QUERY,
} from './constants';
import { UserInputError } from 'apollo-server-express';

type Count = { count: number };

type FromTo = {
  from: number;
  to: number;
};

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const checkArgs = (fromTo: FromTo): FromTo => {
  const { from, to } = fromTo;

  if (typeof from !== 'number' || typeof to !== 'number') {
    throw new UserInputError('From and to params should be numbers');
  }

  if (!from || !to) {
    throw new UserInputError('From and to params are required');
  }

  if (from > to) {
    throw new UserInputError('From param should be less than to param');
  }

  if (from < 0 || to < 0) {
    throw new UserInputError('From and to params should be positive');
  }

  if (to - from > MS_IN_DAY + 1) {
    throw new UserInputError(
      'From and to params should be at least 24 hours apart',
    );
  }

  return { from, to };
};

@Injectable()
export class StatisticsV2Service {
  constructor(@InjectDataSource() readonly dataSource: DataSource) {}

  @SentryWrapper({
    firstBlockTimestamp: 0,
    lastBlockTimestamp: 0,
  })
  public async getBlockchainTimestamps(): Promise<{
    firstBlockTimestamp: number;
    lastBlockTimestamp: number;
  }> {
    const [first] = await this.dataSource.query(FIRST_BLOCK_QUERY);
    const [last] = await this.dataSource.query(LAST_BLOCK_QUERY);

    return {
      firstBlockTimestamp: first.timestamp,
      lastBlockTimestamp: last.timestamp,
    };
  }

  private async executeQuery(query: string, fromTo: FromTo): Promise<Count> {
    const { from, to } = checkArgs(fromTo);

    const result = await this.dataSource.query(query, [from, to]);

    return { count: parseInt(result[0].count, 10) };
  }

  @SentryWrapper()
  public async getExtrinsicsCount(fromTo: FromTo): Promise<Count> {
    return await this.executeQuery(EXTRINSICS_STATISTICS_QUERY, fromTo);
  }

  @SentryWrapper()
  public async getTokenTransferCount(fromTo: FromTo): Promise<Count> {
    return await this.executeQuery(TOKEN_TRANSFER_STATISTICS_QUERY, fromTo);
  }

  @SentryWrapper()
  public async getBalanceTransferCount(fromTo: FromTo): Promise<Count> {
    return await this.executeQuery(BALANCE_TRANSFER_STATISTICS_QUERY, fromTo);
  }

  @SentryWrapper()
  public async getCollectionCreatedCount(fromTo: FromTo): Promise<Count> {
    return await this.executeQuery(COLLECTION_CREATED_STATISTICS_QUERY, fromTo);
  }

  @SentryWrapper()
  public async getTokenCreatedCount(fromTo: FromTo): Promise<Count> {
    return await this.executeQuery(TOKEN_CREATED_STATISTICS_QUERY, fromTo);
  }

  @SentryWrapper()
  public async getNewAccountCount(fromTo: FromTo): Promise<Count> {
    return await this.executeQuery(NEW_ACCOUNT_STATISTICS_QUERY, fromTo);
  }
}
