import { ScanProcessor } from './scan-processor';
import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Collections } from '@entities/Collections';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { SdkService } from '../sdk.service';
import { EventName, SchemaVersion } from '@common/constants';
import { normalizeSubstrateAddress } from '@common/utils';

type CollectionData = {
  name: string;
  tokenPrefix: string;
  owner: string;
};

@Injectable()
export class CollectionsProcessor extends ScanProcessor {
  private logger: Logger;

  constructor(
    @InjectRepository(Collections)
    private modelRepository: Repository<Collections>,
    protected connection: Connection,
    protected sdkService: SdkService,
  ) {
    super('collections', connection, sdkService);

    this.logger = new Logger('CollectionsProcessor');

    console.log('metadata', this.modelRepository.metadata);

    // todo: Remove some items when models rework is done
    const EVENTS_TO_UPDATE_COLLECTION = [
      // Insert
      EventName.COLLECTION_CREATED,

      // Update
      EventName.COLLECTION_PROPERTY_SET,
      EventName.COLLECTION_PROPERTY_DELETED,
      EventName.PROPERTY_PERMISSION_SET,
      EventName.COLLECTION_SPONSOR_REMOVED,
      EventName.COLLECTION_ADMIN_ADDED,
      EventName.COLLECTION_ADMIN_REMOVED,
      EventName.COLLECTION_OWNED_CHANGED,
      EventName.SPONSORSHIP_CONFIRMED,
      // EventName.ALLOW_LIST_ADDRESS_ADDED, // todo: Too many events. Do we really need to process this event?
      EventName.ALLOW_LIST_ADDRESS_REMOVED,
      EventName.COLLECTION_LIMIT_SET,
      EventName.COLLECTION_SPONSOR_SET,

      // todo: debug
      // 'system.ExtrinsicSuccess',
    ];

    EVENTS_TO_UPDATE_COLLECTION.forEach((eventName) =>
      this.addEventHandler(eventName, this.upsertHandler.bind(this)),
    );

    this.addEventHandler(
      EventName.COLLECTION_DESTROYED,
      this.destroyHandler.bind(this),
    );

    this.logger.log('Starting processor...');
  }

  private async getCollectionData(
    collectionId: number,
  ): Promise<CollectionData | null> {
    const result = await this.sdkService.getCollection(collectionId as number);

    return result ? result : null;
  }

  /**
   * Creates 'collection_cover' field value from other fields.
   */
  createCollectionCoverValue({
    schema_version,
    offchain_schema,
    variable_on_chain_schema,
  }) {
    let result = null;

    try {
      const urlPattern = /^["']?(http[s]?:\/\/[^"']+)["']?$/;

      if (
        schema_version === SchemaVersion.IMAGE_URL &&
        offchain_schema &&
        urlPattern.test(offchain_schema)
      ) {
        const match = offchain_schema.match(urlPattern);
        const plainUrl = match[1];
        result = String(plainUrl).replace('{id}', '1');
      } else if (variable_on_chain_schema) {
        const parsedSchema = JSON.parse(variable_on_chain_schema);
        const { collectionCover } = parsedSchema;
        if (collectionCover) {
          result = collectionCover;
        }
      }
    } catch (error) {
      this.logger.error(
        {
          error,
          schema_version,
          offchain_schema,
          variable_on_chain_schema,
        },
        'Collection cover processing error',
      );
    }

    return result;
  }

  prepareDataToWrite(sdkEntity) {
    console.log('sdkEntity', sdkEntity);

    const {
      id: collection_id,
      owner,
      name,
      description,
      sponsorship,
      tokenPrefix: token_prefix,
      mode,
      properties: {
        offchainSchema: offchain_schema = null,
        constChainSchema: const_chain_schema = null,
        variableOnChainSchema: variable_on_chain_schema = null,
        schemaVersion: schema_version = null,
      } = {},
      limits: {
        // todo: get effective limits
        tokenLimit: token_limit = 0,
        accountTokenOwnershipLimit: limits_account_ownership,
        sponsoredDataSize: limits_sponsore_data_size,
        sponsoredDataRateLimit: limits_sponsore_data_rate,
        ownerCanTransfer: owner_can_transfer,
        ownerCanDestroy: owner_can_destroy,
      },
      permissions: { mintMode: mint_mode },
    } = sdkEntity;

    return {
      collection_id,
      owner,
      name,
      description,
      offchain_schema,
      token_limit,
      const_chain_schema, // todo: stringify?
      variable_on_chain_schema,
      limits_account_ownership,
      limits_sponsore_data_size,
      limits_sponsore_data_rate,
      owner_can_transfer,
      owner_can_destroy,
      sponsorship,
      schema_version,
      token_prefix,
      mode,
      mint_mode,
      owner_normalized: normalizeSubstrateAddress(owner),
      collection_cover: this.createCollectionCoverValue({
        schema_version,
        offchain_schema,
        variable_on_chain_schema,
      }),
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
    };

    try {
      const collectionId = params[0].value as number;

      log.collectionId = collectionId;

      const collectionData = await this.getCollectionData(collectionId);

      if (collectionData) {
        // todo: Do not log the full entity because now this object is too big
        log.entity = collectionData.name;

        const dataToWrite = this.prepareDataToWrite(collectionData);

        // console.log('dataToWrite', dataToWrite);

        await this.modelRepository.upsert(dataToWrite, ['collection_id']);
      } else {
        log.entity = null;

        // todo: Delete db record
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
    };

    try {
      const collectionId = params[0].value as number;

      log.collectionId = collectionId;

      this.logger.verbose({ ...log });

      // todo: Delete db record
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
      process.exit(1);
    }
  }
}
