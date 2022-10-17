import { EventName, SubscriberAction } from '@common/constants';
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
  UniqueCollectionSchemaDecoded,
  PropertyKeyPermission,
} from '@unique-nft/substrate-client/tokens';
import { Repository } from 'typeorm';
import { SdkService } from '../sdk/sdk.service';

type ParsedSchemaFields = {
  collectionCover?: string;
  schemaVersion?: string;
  offchainSchema?: string;
  constOnChainSchema?: object;
  variableOnChainSchema?: object;
};

interface CollectionData {
  collectionDecoded: CollectionInfoWithSchema | null;
  collectionLimits: CollectionLimits | null;
  tokenPropertyPermissions: PropertyKeyPermission[];
}

@Injectable()
export class CollectionService {
  private readonly logger = new Logger(CollectionService.name);

  constructor(
    private sdkService: SdkService,
    @InjectRepository(Collections)
    private collectionsRepository: Repository<Collections>,
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
  ) {}

  /**
   * Recieves collection data from sdk.
   */
  private async getCollectionData(
    collectionId: number,
    at: string,
  ): Promise<CollectionData | null> {
    const collectionDecoded = await this.sdkService.getCollection(
      collectionId,
      at,
    );

    if (!collectionDecoded) {
      return null;
    }

    const [collectionLimits, tokenPropertyPermissions] = await Promise.all([
      this.sdkService.getCollectionLimits(collectionId, at),
      this.sdkService.getTokenPropertyPermissions(collectionId, at),
    ]);

    return {
      collectionDecoded,
      collectionLimits,
      tokenPropertyPermissions,
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
      collectionCover: ipfsCid || fullUrl,
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
          rawConstOnChainSchema,
        ),
        variableOnChainSchema: this.processJsonStringifiedValue(
          rawVariableOnChainSchema,
        ),
      };
    }

    return result;
  }

  private getSchemaValuesFromProperties(
    properties: CollectionProperty[],
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
    collectionData: CollectionData,
  ): Promise<Collections> {
    const { collectionDecoded, collectionLimits, tokenPropertyPermissions } =
      collectionData;

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
    } = this.processSchema(schema || schemaFromProperties);

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
      mode,
      mint_mode: mintMode,
      nesting_enabled: nesting?.collectionAdmin || nesting?.tokenOwner,
      owner_normalized: normalizeSubstrateAddress(owner),
      collection_cover: collectionCover,
      burned: collection?.burned ?? false,
    };
  }

  async update({
    collectionId,
    eventName,
    blockTimestamp,
    blockHash,
  }: {
    collectionId: number;
    eventName: string;
    blockTimestamp: number;
    blockHash: string;
  }): Promise<SubscriberAction> {
    const collectionData = await this.getCollectionData(
      collectionId,
      blockHash,
    );

    let result;

    if (collectionData) {
      const preparedData = await this.prepareDataForDb(collectionData);

      await this.collectionsRepository.upsert(
        {
          ...preparedData,
          date_of_creation:
            eventName === EventName.COLLECTION_CREATED
              ? normalizeTimestamp(blockTimestamp)
              : undefined,
        },
        ['collection_id'],
      );

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
        { burned: true },
      ),
      this.tokensRepository.update(
        { collection_id: collectionId },
        { burned: true },
      ),
    ]);
  }
}
