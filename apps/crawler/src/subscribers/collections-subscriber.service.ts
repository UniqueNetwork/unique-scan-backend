import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Store } from '@subsquid/typeorm-store';
import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { EventName } from '@common/constants';
import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
import {
  CollectionInfoWithSchema,
  CollectionLimits,
  UniqueCollectionSchemaDecoded,
} from '@unique-nft/sdk/tokens';
import { SdkService } from '../sdk.service';
import { ProcessorService } from './processor.service';
import ISubscriberService from './subscriber.interface';

type ParsedSchemaFields = {
  collectionCover?: string;
  schemaVersion?: string;
  offchainSchema?: string;
  constOnChainSchema?: object;
  variableOnChainSchema?: object;
};
@Injectable()
export class CollectionsSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(CollectionsSubscriberService.name);

  constructor(
    @InjectRepository(Collections)
    private collectionsRepository: Repository<Collections>,
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
    private processorService: ProcessorService,
    private sdkService: SdkService,
  ) {}

  subscribe() {
    // todo: Remove some items when models rework is done
    const EVENTS_TO_UPDATE_COLLECTION = [
      // Insert
      EventName.COLLECTION_CREATED,

      // Update
      EventName.COLLECTION_PROPERTY_SET,
      EventName.COLLECTION_PROPERTY_DELETED,
      EventName.PROPERTY_PERMISSION_SET,
      EventName.COLLECTION_SPONSOR_REMOVED,
      EventName.COLLECTION_OWNED_CHANGED,
      EventName.SPONSORSHIP_CONFIRMED,
      // EventName.ALLOW_LIST_ADDRESS_ADDED, // todo: Too many events. Do we really need to process this event?
      EventName.ALLOW_LIST_ADDRESS_REMOVED,
      EventName.COLLECTION_LIMIT_SET,
      EventName.COLLECTION_SPONSOR_SET,
    ];

    EVENTS_TO_UPDATE_COLLECTION.forEach((eventName) =>
      this.processorService.processor.addEventHandler(
        eventName,
        this.upsertHandler.bind(this),
      ),
    );

    this.processorService.processor.addEventHandler(
      EventName.COLLECTION_DESTROYED,
      this.destroyHandler.bind(this),
    );
  }

  private async getCollectionData(
    collectionId: number,
  ): Promise<[CollectionInfoWithSchema | null, CollectionLimits | null]> {
    return Promise.all([
      this.sdkService.getCollection(collectionId),
      this.sdkService.getCollectionLimits(collectionId),
    ]);
  }

  private processJsonStringifiedValue(rawValue) {
    let result: object | null = null;
    try {
      result = typeof rawValue === 'object' ? rawValue : JSON.parse(rawValue);
    } catch (err) {
      // Bad value, log it
      result = { raw: rawValue };
    }

    return result;
  }

  private processSchema(
    schema: UniqueCollectionSchemaDecoded,
    collectionId: number,
  ): ParsedSchemaFields {
    let result = {};

    if (!schema) {
      this.logger.warn(`No collection schema ${collectionId}`);
      return result;
    }
    // todo: Find out what to do with 'properties', 'attributesSchema'

    const { schemaName } = schema;
    if (schemaName == '_old_') {
      const {
        coverPicture: { fullUrl, ipfsCid },
        schemaVersion,
        attributesSchemaVersion,
        oldProperties: {
          _old_schemaVersion: oldSchemaVersion,
          _old_offchainSchema: offchainSchema,
          _old_constOnChainSchema: rawConstOnChainSchema,
          _old_variableOnChainSchema: rawVariableOnChainSchema,
        },
      } = schema;

      result = {
        collectionCover: ipfsCid || fullUrl,
        schemaVersion: `${schemaName}@${schemaVersion}@${attributesSchemaVersion}@${oldSchemaVersion}`,
        offchainSchema,
        constOnChainSchema: this.processJsonStringifiedValue(
          rawConstOnChainSchema,
        ),
        variableOnChainSchema: this.processJsonStringifiedValue(
          rawVariableOnChainSchema,
        ),
      };
    } else if (schemaName === 'unique') {
      const {
        coverPicture: { fullUrl, ipfsCid },
        schemaVersion,
        attributesSchemaVersion,
      } = schema;

      result = {
        collectionCover: ipfsCid || fullUrl,
        schemaVersion: `${schemaName}@${schemaVersion}@${attributesSchemaVersion}`,
      };
    } else {
      this.logger.warn(`Unknown schema name ${schemaName}`);
    }

    return result;
  }

  prepareDataToWrite(
    collectionInfo: CollectionInfoWithSchema,
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
      schema,
      permissions: { mintMode: mint_mode },
    } = collectionInfo;

    const {
      collectionCover = null,
      schemaVersion = null,
      offchainSchema = null,
      constOnChainSchema = null,
      variableOnChainSchema = null,
    } = this.processSchema(schema, collection_id);

    const {
      tokenLimit: token_limit,
      accountTokenOwnershipLimit: limits_account_ownership,
      sponsoredDataSize: limits_sponsore_data_size,
      sponsoredDataRateLimit: limits_sponsore_data_rate,
      ownerCanTransfer: owner_can_transfer,
      ownerCanDestroy: owner_can_destroy,
    } = collectionLimits;

    return {
      collection_id,
      owner,
      name,
      description,
      offchain_schema: offchainSchema,
      token_limit: token_limit || 0,
      const_chain_schema: constOnChainSchema,
      variable_on_chain_schema: variableOnChainSchema,
      limits_account_ownership,
      limits_sponsore_data_size,
      limits_sponsore_data_rate,
      owner_can_transfer,
      owner_can_destroy,
      sponsorship: sponsorship?.isConfirmed ? sponsorship.address : null,
      schema_version: schemaVersion,
      token_prefix,
      mode,
      mint_mode,
      owner_normalized: normalizeSubstrateAddress(owner),
      collection_cover: collectionCover,
    };
  }

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: blockTimestamp },
      event: { name: eventName, args },
    } = ctx;

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      entity: null as null | object | string,
      collectionId: null as null | number,
    };

    try {
      const collectionId = this.getCollectionIdFromArgs(args);

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

        await this.collectionsRepository.upsert(
          {
            ...dataToWrite,
            date_of_creation:
              eventName === EventName.COLLECTION_CREATED
                ? normalizeTimestamp(blockTimestamp)
                : undefined,
          },
          ['collection_id'],
        );
      } else {
        // No entity returned from sdk. Most likely it was destroyed in a future block.
        log.entity = null;

        await this.deleteCollection(collectionId);
      }

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }

  private async destroyHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: blockTimestamp },
      event: { name: eventName, args },
    } = ctx;

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      collectionId: null as null | number,
    };

    try {
      const collectionId = this.getCollectionIdFromArgs(args);

      log.collectionId = collectionId;

      await this.deleteCollection(collectionId);

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }

  // Delete db collection record and related tokens
  private deleteCollection(collectionId) {
    return Promise.all([
      this.collectionsRepository.delete(collectionId),
      this.tokensRepository.delete({ collection_id: collectionId }),
    ]);
  }

  private getCollectionIdFromArgs(args): number {
    return typeof args === 'number' ? args : (args[0] as number);
  }
}
