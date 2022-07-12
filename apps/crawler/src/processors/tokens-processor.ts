import { ScanProcessor } from './scan-processor';
import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Tokens } from '@entities/Tokens';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { SdkService } from '../sdk.service';
import { EventName } from '@common/constants';
import { normalizeSubstrateAddress } from '@common/utils';
import { ProcessorConfigService } from '../processor.config.service';

type TokenData =
  | {
      name: string;
      tokenPrefix: string;
      owner: string;
    }
  | object; // todo: remove me

@Injectable()
export class TokensProcessor {
  private readonly logger = new Logger(TokensProcessor.name);
  private processor: ScanProcessor;
  public name = 'tokens';

  constructor(
    @InjectRepository(Tokens)
    private modelRepository: Repository<Tokens>,
    protected connection: Connection,
    protected sdkService: SdkService,
    private processorConfigService: ProcessorConfigService,
  ) {
    this.processor = new ScanProcessor(
      this.name,
      this.connection,
      processorConfigService.getDataSource(),
      processorConfigService.getRange(),
      processorConfigService.getTypesBundle(),
    );

    // todo: Remove some items when models rework is done
    const EVENTS_TO_UPDATE = [
      // Insert
      EventName.ITEM_CREATED,

      // Update
      EventName.TRANSFER,

      // todo: Or maybe these events are reletad to collection?
      EventName.TOKEN_PROPERTY_SET,
      EventName.TOKEN_PROPERTY_DELETED,
    ];

    EVENTS_TO_UPDATE.forEach((eventName) =>
      this.processor.addEventHandler(eventName, this.upsertHandler.bind(this)),
    );

    this.processor.addEventHandler(
      EventName.ITEM_DESTROYED,
      this.destroyHandler.bind(this),
    );
  }

  private async getTokenData(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenData | null> {
    const result = await this.sdkService.getToken(collectionId, tokenId);

    return result ? result : null;
  }

  prepareDataToWrite(sdkEntity) {
    const {
      id: token_id,
      collectionId: collection_id,
      owner,
      properties: { constData: data = {} } = {},
    } = sdkEntity;

    return {
      token_id,
      collection_id,
      owner,
      owner_normalized: normalizeSubstrateAddress(owner),
      data,
    };
  }

  private async upsertHandler(ctx: EventHandlerContext): Promise<void> {
    const { name: eventName, blockNumber, blockTimestamp, params } = ctx.event;

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      entity: null as null | object | string,
      collectionId: null as null | number,
      tokenId: null as null | number,
    };

    try {
      const collectionId = params[0].value as number;
      const tokenId = params[1].value as number;

      log.collectionId = collectionId;
      log.tokenId = tokenId;

      const tokenData = await this.getTokenData(collectionId, tokenId);

      if (tokenData) {
        const dataToWrite = this.prepareDataToWrite(tokenData);

        log.entity = dataToWrite;

        // Write collection data into db
        await this.modelRepository.upsert(
          {
            ...dataToWrite,
            date_of_creation:
              eventName === EventName.ITEM_CREATED ? blockTimestamp : undefined,
          },
          ['collection_id', 'token_id'],
        );
      } else {
        // No entity returned from sdk. Most likely it was destroyed in a future block.
        log.entity = null;

        // Delete db record
        await this.modelRepository.delete({
          collection_id: collectionId,
          token_id: tokenId,
        });
      }

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }

  private async destroyHandler(ctx: EventHandlerContext): Promise<void> {
    const { name: eventName, blockNumber, blockTimestamp, params } = ctx.event;

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      collectionId: null as null | number,
      tokenId: null as null | number,
    };

    try {
      const collectionId = params[0].value as number;
      const tokenId = params[1].value as number;

      log.collectionId = collectionId;
      log.tokenId = tokenId;

      // Delete db record
      await this.modelRepository.delete({
        collection_id: collectionId,
        token_id: tokenId,
      });

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
      process.exit(1);
    }
  }

  public run(): void {
    const params = this.processorConfigService.getAllParams();

    this.logger.log({
      msg: `Starting ${this.name} crawler...`,
      params,
    });

    this.processor.run();
  }
}
