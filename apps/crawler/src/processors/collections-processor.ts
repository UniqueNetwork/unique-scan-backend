import { ScanProcessor } from './scan-processor';
import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Collections } from '@entities/Collections';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { SdkService } from '../sdk.service';
import { EventName, SchemaVersion } from '@common/constants';
import { normalizeSubstrateAddress } from '@common/utils';
import { CollectionInfo, CollectionLimits } from '@unique-nft/sdk/tokens';

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
  ): Promise<[CollectionInfo, CollectionLimits] | null> {
    const result = await Promise.all([
      this.sdkService.getCollection(collectionId),
      this.sdkService.getCollectionLimits(collectionId),
    ]).catch();

    return result;
  }

  /**
   * Creates 'collection_cover' field value from other fields.
   */
  createCollectionCoverValue({
    collection_id,
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
      } else if (variable_on_chain_schema?.collectionCover) {
        result = variable_on_chain_schema.collectionCover;
      }
    } catch (error) {
      this.logger.error({
        error: 'Collection cover processing error',
        message: error.message,
        collection_id,
        schema_version,
        offchain_schema,
        variable_on_chain_schema,
      });
    }

    return result;
  }

  prepareDataToWrite(
    collectionInfo: CollectionInfo,
    collectionLimits: CollectionLimits,
  ) {
    const {
      id: collection_id,
      owner,
      name,
      description,
      sponsorship,
      tokenPrefix: token_prefix,
      mode,
      properties: {
        offchainSchema: offchain_schema,
        constOnChainSchema: const_chain_schema,
        variableOnChainSchema: rawVariableOnChainSchema,
        schemaVersion: schema_version,
      } = {},
      permissions: { mintMode: mint_mode },
    } = collectionInfo;

    const {
      tokenLimit: token_limit,
      accountTokenOwnershipLimit: limits_account_ownership,
      sponsoredDataSize: limits_sponsore_data_size,
      sponsoredDataRateLimit: limits_sponsore_data_rate,
      ownerCanTransfer: owner_can_transfer,
      ownerCanDestroy: owner_can_destroy,
    } = collectionLimits;

    // console.log(collection_id, !!collectionInfo, !!collectionLimits);

    let processedVariableOnChainSchema: object | null = null;
    try {
      processedVariableOnChainSchema =
        typeof rawVariableOnChainSchema === 'object'
          ? rawVariableOnChainSchema
          : JSON.parse(rawVariableOnChainSchema);
    } catch (err) {
      // Bad value, log it
      processedVariableOnChainSchema = { raw: rawVariableOnChainSchema };
    }

    return {
      collection_id,
      owner,
      name,
      description,
      offchain_schema,
      token_limit: token_limit || 0,
      const_chain_schema,
      variable_on_chain_schema: processedVariableOnChainSchema,
      limits_account_ownership,
      limits_sponsore_data_size,
      limits_sponsore_data_rate,
      owner_can_transfer:
        owner_can_transfer === null ? false : owner_can_transfer, // todo: Remove when sdk is ready
      owner_can_destroy: owner_can_destroy === null ? true : owner_can_destroy, // todo: Remove when sdk is ready,
      sponsorship: sponsorship?.isConfirmed ? sponsorship.address : null,
      schema_version,
      token_prefix,
      mode,
      mint_mode,
      owner_normalized: normalizeSubstrateAddress(owner),
      collection_cover: this.createCollectionCoverValue({
        collection_id,
        schema_version,
        offchain_schema,
        variable_on_chain_schema: processedVariableOnChainSchema,
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

      const [collectionInfo, collectionLimits] = await this.getCollectionData(
        collectionId,
      );

      if (collectionInfo) {
        const dataToWrite = this.prepareDataToWrite(
          collectionInfo,
          collectionLimits,
        );

        // console.log('dataToWrite', dataToWrite);

        // Do not log the full entity because this object is quite big
        log.entity = dataToWrite.name;

        await this.modelRepository.upsert(
          {
            ...dataToWrite,
            date_of_creation:
              eventName === EventName.COLLECTION_CREATED
                ? blockTimestamp
                : undefined,
          },
          ['collection_id'],
        );
      } else {
        log.entity = null;

        // Delete db record
        await this.modelRepository.delete(collectionId);
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

      // Delete db record
      await this.modelRepository.delete(collectionId);

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
      process.exit(1);
    }
  }
}
