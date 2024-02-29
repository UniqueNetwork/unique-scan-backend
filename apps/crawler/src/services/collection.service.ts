import { chunk } from 'lodash';
import {
  COLLECTION_BURN_EVENTS,
  COLLECTION_UPDATE_EVENTS,
  EventName,
  SubscriberAction,
} from '@common/constants';
import {
  normalizeSubstrateAddress,
  normalizeTimestamp,
  sanitizePropertiesValues,
} from '@common/utils';
import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CollectionInfoWithSchema,
  CollectionLimits,
  CollectionProperty,
  IV2Collection,
  PropertyKeyPermission,
  UniqueCollectionSchemaDecoded,
} from '@unique-nft/substrate-client/tokens';
import { Repository } from 'typeorm';

import { ConfigService } from '@nestjs/config';
import { Config } from '../config/config.module';
import { Event } from '@entities/Event';
import { SdkService } from '@common/sdk/sdk.service';

type ParsedSchemaFields = {
  collectionCover?: string;
  schemaVersion?: string;
  offchainSchema?: string;
  constOnChainSchema?: object;
  variableOnChainSchema?: object;
};

interface CollectionData {
  collectionDecoded: CollectionInfoWithSchema | null;
  collectionDecodedV2: IV2Collection | null;
  collectionLimits: CollectionLimits | null;
  tokenPropertyPermissions: PropertyKeyPermission[];
}

@Injectable()
export class CollectionService {
  private readonly logger = new Logger(CollectionService.name);

  constructor(
    private sdkService: SdkService,

    private configService: ConfigService<Config>,

    @InjectRepository(Collections)
    private collectionsRepository: Repository<Collections>,

    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>
  ) {}

  /**
   * Recieves collection data from sdk.
   */
  private async getCollectionData(
    collectionId: number,
    at: string
  ): Promise<CollectionData | null> {
    let collectionDecoded = await this.sdkService.getCollection(
      collectionId,
      at
    );

    let collectionDecodedV2 = await this.sdkService.getCollectionV2(
      collectionId,
      at
    );

    let checkAt = false; // for burned collections

    if (!collectionDecoded) {
      collectionDecoded = await this.sdkService.getCollection(collectionId, at);
      checkAt = true;
    }

    if (!collectionDecoded) return null;

    // TODO: delete after rft support
    // if (collectionDecoded.mode === CollectionMode.ReFungible) {
    //   return null;
    // }
    // debugger;
    const [collectionLimits, tokenPropertyPermissions] = await Promise.all([
      this.sdkService.getCollectionLimits(
        collectionId,
        checkAt ? at : undefined
      ),
      this.sdkService.getTokenPropertyPermissions(
        collectionId,
        checkAt ? at : undefined
      ),
    ]);

    return {
      collectionDecoded,
      collectionDecodedV2,
      collectionLimits: collectionLimits || collectionDecoded.limits,
      tokenPropertyPermissions:
        tokenPropertyPermissions || collectionDecoded.tokenPropertyPermissions,
    };
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
    collectionV2?: IV2Collection
  ): ParsedSchemaFields {
    let result = {};

    const {
      schemaName,
      schemaVersion,
      attributesSchemaVersion,
      coverPicture: { fullUrl, ipfsCid },
      attributesSchema,
    } = schema;

    const schemaVersionCombined = `${schemaName}@${schemaVersion}@${attributesSchemaVersion}`;

    result = {
      collectionCover: ipfsCid || fullUrl || collectionV2?.cover_image?.url,
      schemaVersion: schemaVersionCombined,
      attributesSchema,
    };

    if (schemaName == '_old_') {
      const {
        oldProperties: {
          _old_schemaVersion: oldSchemaVersion,
          _old_offchainSchema: offchainSchema,
          _old_constOnChainSchema: rawConstOnChainSchema,
          _old_variableOnChainSchema: rawVariableOnChainSchema,
        },
      } = schema;

      result = {
        ...result,

        schemaVersion: `${schemaVersionCombined}@${oldSchemaVersion}`,
        offchainSchema,
        constOnChainSchema: this.processJsonStringifiedValue(
          rawConstOnChainSchema
        ),
        variableOnChainSchema: this.processJsonStringifiedValue(
          rawVariableOnChainSchema
        ),
      };
    }

    return result;
  }

  private getSchemaValuesFromProperties(
    properties: CollectionProperty[]
  ): UniqueCollectionSchemaDecoded {
    const result = {
      schemaName: '_properties_',
      schemaVersion: '',
      attributesSchemaVersion: '',
      coverPicture: {},
    } as ParsedSchemaFields;

    Object.values(properties).reduce((acc, curr) => {
      let { key, value } = curr;
      try {
        value = JSON.parse(value);
      } catch (_) {
        // I should try
      }

      if (key.startsWith('coverPicture.')) {
        // Filling up sub-object by key "coverPicture"
        key = key.replace('coverPicture.', '');
        acc['coverPicture'][key] = value;
      } else {
        acc[key] = value;
      }

      return acc;
    }, result);

    return result as UniqueCollectionSchemaDecoded;
  }

  private async prepareDataForDb(
    collectionData: CollectionData
  ): Promise<Omit<Collections, 'attributes'>> {
    const {
      collectionDecoded,
      collectionDecodedV2,
      collectionLimits,
      tokenPropertyPermissions,
    } = collectionData;

    const {
      id: collection_id,
      owner,
      name,
      description,
      sponsorship,
      tokenPrefix: token_prefix,
      mode,
      schema,
      permissions,
      properties = [],
    } = collectionDecoded;

    let schemaFromProperties = {} as UniqueCollectionSchemaDecoded;

    if (!schema) {
      this.logger.warn(`No collection schema ${collection_id}`);

      // No schema provided by sdk. Try to figure out some schema values from properties.
      schemaFromProperties = this.getSchemaValuesFromProperties(properties);
    }

    const {
      collectionCover = null,
      schemaVersion = null,
      offchainSchema = null,
      constOnChainSchema = null,
      variableOnChainSchema = null,

      // @ts-ignore // todo: Remove when sdk ready
      attributesSchema = {},
    } = this.processSchema(schema || schemaFromProperties, collectionDecodedV2);

    const { mintMode, nesting } = permissions;

    const {
      tokenLimit: token_limit,
      accountTokenOwnershipLimit: limits_account_ownership,
      sponsoredDataSize: limits_sponsore_data_size,
      sponsoredDataRateLimit: limits_sponsore_data_rate,
      ownerCanTransfer: owner_can_transfer,
      ownerCanDestroy: owner_can_destroy,
    } = collectionLimits;

    const collection = await this.collectionsRepository.findOneBy({
      collection_id,
    });

    return {
      collection_id,
      owner,
      name,
      description,
      offchain_schema: offchainSchema,
      token_limit: token_limit || 0,
      schema_v2: collectionDecodedV2 || null,
      properties: sanitizePropertiesValues(properties),
      permissions,
      token_property_permissions: tokenPropertyPermissions,
      attributes_schema: attributesSchema,
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
      mode: mode === 'ReFungible' ? 'RFT' : mode,
      mint_mode: mintMode,
      nesting_enabled: nesting?.collectionAdmin || nesting?.tokenOwner,
      owner_normalized: normalizeSubstrateAddress(owner),
      collection_cover: collectionCover,
      burned: collection?.burned ?? false,
    };
  }

  async batchProcess({
    events,
    blockCommonData,
  }: {
    events: Event[];
    blockCommonData: {
      block_hash: string;
      timestamp: number;
      block_number: number;
    };
  }): Promise<any> {
    const collectionEvents = this.extractCollectionEvents(events);
    const eventChunks = chunk(
      collectionEvents,
      this.configService.get('scanCollectionsBatchSize')
    );

    let rejected = [];
    for (const chunk of eventChunks) {
      const result = await Promise.allSettled(
        chunk.map((event) => {
          const { section, method, values } = event;
          const { collectionId } = values as unknown as {
            collectionId: number;
          };

          const { block_hash, timestamp, block_number } = blockCommonData;
          const eventName = `${section}.${method}`;

          if (COLLECTION_UPDATE_EVENTS.includes(eventName)) {
            return this.update({
              collectionId,
              eventName,
              blockTimestamp: timestamp,
              blockHash: block_hash,
              blockNumber: block_number,
            });
          } else {
            return this.burn(collectionId);
          }
        })
      );

      // todo: Process rejected tokens again or maybe process sdk disconnect
      rejected = [
        ...rejected,
        ...result.filter(({ status }) => status === 'rejected'),
      ];
    }

    return {
      totalEvents: collectionEvents.length,
      collection:
        collectionEvents.length === 1 ? collectionEvents[0].values : null,
      rejected,
    };
  }

  async update({
    collectionId,
    eventName,
    blockTimestamp,
    blockHash,
    blockNumber,
  }: {
    collectionId: number;
    eventName: string;
    blockTimestamp: number;
    blockHash: string;
    blockNumber: number;
  }): Promise<SubscriberAction> {
    const collectionData = await this.getCollectionData(
      collectionId,
      blockHash
    );

    let result;

    if (collectionData) {
      const preparedData = await this.prepareDataForDb(collectionData);

      if (eventName === EventName.COLLECTION_CREATED) {
        preparedData.date_of_creation = normalizeTimestamp(blockTimestamp);

        preparedData.created_at_block_hash = blockHash;
        preparedData.created_at_block_number = blockNumber;
        preparedData.updated_at_block_hash = blockHash;
        preparedData.updated_at_block_number = blockNumber;
      } else {
        preparedData.updated_at_block_hash = blockHash;
        preparedData.updated_at_block_number = blockNumber;
      }

      await this.collectionsRepository.upsert(preparedData, ['collection_id']);

      result = SubscriberAction.UPSERT;
    } else {
      // No entity returned from sdk. Most likely it was destroyed in a future block.
      await this.burn(collectionId);

      result = SubscriberAction.DELETE_NOT_FOUND;
    }

    return result;
  }

  async burn(collectionId: number) {
    return Promise.allSettled([
      this.collectionsRepository.update(
        { collection_id: collectionId },
        { burned: true }
      ),
      this.tokensRepository.update(
        { collection_id: collectionId },
        { burned: true }
      ),
    ]);
  }

  private extractCollectionEvents(events: Event[]) {
    return events.filter(({ section, method }) => {
      const eventName = `${section}.${method}`;
      return (
        COLLECTION_UPDATE_EVENTS.includes(eventName) ||
        COLLECTION_BURN_EVENTS.includes(eventName)
      );
    });
  }
}
