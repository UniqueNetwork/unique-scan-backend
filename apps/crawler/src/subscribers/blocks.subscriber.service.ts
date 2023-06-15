import { Injectable, Logger } from '@nestjs/common';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { ISubscriberService } from './subscribers.service';
import { BlockService } from '../services/block.service';
import { ExtrinsicService } from '../services/extrinsic.service';
import { EventService } from '../services/event/event.service';
import { Event } from '@entities/Event';
import { HarvesterStoreService } from './processor/harvester-store.service';
import * as console from 'console';
import { Reader } from '@unique-nft/harvester';
import { cyan, green, blue, magenta, yellow } from 'cli-color';
import { capitalize } from '@common/utils';
import { BlockEntity } from '@unique-nft/harvester/src/database/entities';

import { EventName } from '@common/constants';
import { Block } from '@entities/Block';
import { ISpecSystemVersion, SdkService } from '@common/sdk/sdk.service';

export interface IBlockCommonData {
  blockNumber: number;
  blockTimestamp: number;
  ss58Prefix: number;
  blockHash?: string;
}

export interface IBlockDataContainer {
  block_number: number;
  block_hash: string;
  parent_hash: string;
  extrinsics_root?: string;
  state_root?: string;
  spec_name: string;
  spec_version: string;
  timestamp: string;
  total_events: number;
  num_transfers: number;
  new_accounts: number;
  total_extrinsics: number;
}

export interface IItemCounts {
  totalEvents: number;
  totalExtrinsics: number;
  numTransfers: number;
  newAccounts: number;
}

export interface EventsProcessingResult {
  events: Event[];
  collectionsResult: ItemsBatchProcessingResult | null;
  tokensResult: ItemsBatchProcessingResult | null;
}

export interface ItemsBatchProcessingResult {
  totalEvents: number;
  rejected: object[];
}

@Injectable()
export class BlocksSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(BlocksSubscriberService.name, {
    timestamp: true,
  });

  private spec: ISpecSystemVersion | null = null;
  private blankBlocks: BlockEntity[] = [];
  private readFromHead = false;
  private cutOff = false;
  private readFromHeadInterval;
  private lastHandledBlockHash = '';
  constructor(
    private blockService: BlockService,

    private sdkService: SdkService,
    private extrinsicService: ExtrinsicService,
    private eventService: EventService,

    private harvesterStore: HarvesterStoreService,

    private reader: Reader,

    @InjectSentry()
    private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(BlocksSubscriberService.name);
  }

  async subscribe() {
    await this.harvesterStore.connect();
    const chainProps = await this.sdkService.getChainProperties();
    const stateNumber = await this.harvesterStore.getState();

    this.readFromHeadInterval = setInterval(async () => {
      if (
        (await this.sdkService.getLastBlockHash()) === this.lastHandledBlockHash
      ) {
        clearInterval(this.readFromHeadInterval);
        this.readFromHead = true;
      }
      this.cutOff = true;
    }, 60_000);

    console.dir(stateNumber);
    for await (const block of this.reader.readBlocks(
      stateNumber[0],
      stateNumber[1],
    )) {
      this.logger.log(`Read block: # ${cyan(block.id)}`);
      if (!this.spec) {
        this.spec = await this.sdkService.getSpecLastUpgrade(block.parentHash);
      }
      this.lastHandledBlockHash = block.hash;
      const { isBlank } = this.collectEventsCount(block.extrinsics);
      if (
        this.readFromHead ||
        this.cutOff ||
        !isBlank ||
        this.blankBlocks.length >= 1000
      ) {
        this.cutOff = false;
        if (this.blankBlocks.length) {
          this.logger.log(`Write ${this.blankBlocks.length} blank blocks`);
          await this.handleBlankBlocks(this.blankBlocks);
          this.blankBlocks = [];
        }
        await this.upsertHandlerBlock(block);
        await this.harvesterStore.updateState(block.id);
      } else {
        this.blankBlocks.push(block);
      }
    }
  }

  private getBlockCommonData(block: BlockEntity): Block {
    const { id, hash, parentHash, extrinsics } = block;
    const countEvents = this.collectEventsCount(extrinsics);

    const blockCommonData = {
      block_number: +id,
      block_hash: hash,
      parent_hash: parentHash,
      extrinsics_root: '0x000', // TODO: remove this ???
      state_root: '0x000', // TODO: remove this ???
      ...this.spec,
      timestamp: Math.floor(
        new Date(block.timestamp.getTime()).getTime() / 1000,
      ),
      total_events: countEvents.totalEvents,
      num_transfers: countEvents.numTransfers,
      new_accounts: countEvents.newAccounts,
      total_extrinsics: extrinsics.length,
    } as unknown as Block;
    return blockCommonData;
  }

  private async handleBlankBlocks(blocks: BlockEntity[]): Promise<void> {
    const eventsArrays = await Promise.all(
      blocks.map((b) => this.eventService.extractEventsFromBlock(b)),
    );

    await Promise.all([
      this.blockService.upsert(blocks.map((b) => this.getBlockCommonData(b))),
      this.extrinsicService.upsert(
        blocks.reduce((acc, next) => {
          next.extrinsics.forEach((e) => {
            e.block = next;
          });
          acc.push(...next.extrinsics);
          return acc;
        }, []),
      ),
      this.eventService.upsert(
        eventsArrays.reduce((acc, next) => {
          acc.push(...next);
          return acc;
        }, []),
      ),
    ]);
  }

  private async upsertHandlerBlock(blockData: BlockEntity): Promise<void> {
    try {
      const { extrinsics } = blockData;
      extrinsics.forEach((e) => {
        e.block = blockData;
      });

      const blockCommonData = this.getBlockCommonData(blockData);

      const { speckHash } = await this.eventService.process(blockData);

      if (speckHash) {
        this.spec = null;
      }

      await Promise.all([
        this.blockService.upsert(blockCommonData),
        this.extrinsicService.upsert(extrinsics),
      ]);

      // Logger
      extrinsics.map((value) => {
        if (
          value.section !== 'parachainSystem' &&
          value.section !== 'timestamp'
        ) {
          const eventsNameArray = extrinsics
            .map((value) => {
              if (
                value.section !== 'parachainSystem' &&
                value.section !== 'timestamp'
              ) {
                return `${capitalize(value.section)}.${capitalize(
                  value.method,
                )}`;
              }
            })
            .filter((value) => !!value);

          this.logger.log(
            `Find in block: # ${blue(blockData.id)} events ${eventsNameArray}`,
          );
        }
      });
    } catch (error) {
      this.logger.error({ block: blockData.id, error: error.message || error });
      this.sentry.instance().captureException({ block: blockData.id, error });
    }
  }

  private collectEventsCount(extrinsics) {
    const itemCounts = {
      totalEvents: 0,
      numTransfers: 0,
      newAccounts: 0,
      isBlank:
        extrinsics
          .map((e) => {
            return e.events.filter(
              (e) =>
                !(e.section === 'system' && e.method === 'ExtrinsicSuccess'),
            ).length;
          })
          .filter((count) => count > 0).length === 0,
    };

    extrinsics.map((ext) => {
      ext.events.forEach((event) => {
        const name = `${capitalize(event.section)}.${capitalize(event.method)}`;
        itemCounts.totalEvents += 1;
        if (name === EventName.BALANCES_TRANSFER) {
          itemCounts.numTransfers += 1;
        } else if (name === EventName.BALANCES_ENDOWED) {
          itemCounts.newAccounts += 1;
        }
      });
    });

    return itemCounts;
  }
}
