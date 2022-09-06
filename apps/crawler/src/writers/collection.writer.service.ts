import { EventName } from '@common/constants';
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
} from '@unique-nft/substrate-client/tokens';
import { Repository } from 'typeorm';

type ParsedSchemaFields = {
  collectionCover?: string;
  schemaVersion?: string;
  offchainSchema?: string;
  constOnChainSchema?: object;
  variableOnChainSchema?: object;
};

export interface ICollectionData {
  collectionDecoded: CollectionInfoWithSchema | null;
  collectionLimits: CollectionLimits | null;
}

@Injectable()
export class CollectionWriterService {
  private readonly logger = new Logger(CollectionWriterService.name);

  constructor(
    @InjectRepository(Collections)
    private collectionsRepository: Repository<Collections>,
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
  ) {}

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

  private prepareDataForDb(collectionData: ICollectionData): Collections {
    const { collectionDecoded, collectionLimits } = collectionData;

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
      properties: sanitizePropertiesValues(properties),
      token_properties_permissions: permissions,
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
      mint_mode: permissions.mintMode,
      owner_normalized: normalizeSubstrateAddress(owner),
      collection_cover: collectionCover,
    };
  }

  async upsert({
    eventName,
    blockTimestamp,
    collectionData,
  }: {
    eventName: string;
    blockTimestamp: number;
    collectionData: ICollectionData;
  }) {
    const preparedData = this.prepareDataForDb(collectionData);

    return this.collectionsRepository.upsert(
      {
        ...preparedData,
        date_of_creation:
          eventName === EventName.COLLECTION_CREATED
            ? normalizeTimestamp(blockTimestamp)
            : undefined,
      },
      ['collection_id'],
    );
  }

  async delete(collectionId: number) {
    return this.deleteCollectionWithTokens(collectionId);
  }

  // Delete db collection record and related tokens
  private async deleteCollectionWithTokens(collectionId: number) {
    return Promise.all([
      this.collectionsRepository.delete(collectionId),
      this.tokensRepository.delete({ collection_id: collectionId }),
    ]);
  }
}
