import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { SentryWrapper } from '../utils/sentry.decorator';
import { AttributeV1DTO, AttributeV1Value } from './attributeV1DTO';
import { AttributesV1QueryArgs } from './attributesV1.resolver.types';
import { IDataListResponse } from '../utils/gql-query-args';
import * as console from 'console';

class RawAttributeValue {
  isArray: boolean;
  isEnum: boolean;
  value: object;
  rawValue: object | number | number[];
}

@Injectable()
export class AttributesV1Service {
  constructor(private dataSource: DataSource) {}

  /**
   * Creates full list of all possible token attributes with default token_count = 0.
   */
  private getDefaultAttributesList(attributesSchema): AttributeV1DTO[] {
    return Object.entries(attributesSchema).map(
      ([attrKey, attrDescriptor]: [
        string,
        { name: object; enumValues?: object }
      ]) => {
        const { name, enumValues } = attrDescriptor;

        const attribute = {
          key: attrKey,
          name,
          values: [],
        } as AttributeV1DTO;

        if (enumValues) {
          attribute.values = Object.entries(enumValues).map(
            ([enumKey, value]: [string, object]) => ({
              raw_value: String(enumKey),
              value,
              tokens_count: 0,
            })
          );
        }

        return attribute;
      }
    );
  }

  private getAttributeByKey(
    attributesData: AttributeV1DTO[],
    attributeKey: string
  ) {
    return attributesData.find(({ key }) => key == attributeKey);
  }

  /**
   * Finds in attributes list values exact attribute value and returns it's index.
   * If not found, creates new record in values and returns it's index.
   */
  private getAttributeValueIndex(
    attribute: AttributeV1DTO,
    attributeValueObj: AttributeV1Value
  ) {
    const { raw_value: attributeRawValue } = attributeValueObj;
    let index = attribute.values.findIndex(
      ({ raw_value: currentRawValue }) => currentRawValue === attributeRawValue
    );

    if (index === -1) {
      attribute.values.push(attributeValueObj);
      index = this.getAttributeValueIndex(attribute, attributeValueObj);
    }

    return index;
  }

  /**
   * Converts raw attribute value object from tokens.attributes db record
   * into array of AttributeValue objects suitable for AttributesDTO.values.
   */
  private normalizeAttributeValueObj(
    rawAttributeValueObj: RawAttributeValue
  ): AttributeV1Value[] {
    const result = [];
    const { value, rawValue, isArray } = rawAttributeValueObj;

    if (isArray && Array.isArray(rawValue)) {
      rawValue.forEach((rawValue, index) => {
        result.push({
          value: value[index],
          raw_value: String(rawValue),
          tokens_count: 0,
        });
      });
    } else {
      result.push({
        value,
        raw_value: JSON.stringify(rawValue),
        tokens_count: 0,
      });
    }

    return result;
  }

  /**
   * Iterates through collection tokens attributes and calculates 'token_count' for every attribute value.
   */
  private async collectTokenCounts(
    collectionId: number,
    attributesSchema: object
  ): Promise<AttributeV1DTO[]> {
    // Get list of all possible attributes with default tokens_count = 0
    const resultAttributesList = [
      ...this.getDefaultAttributesList(attributesSchema),
    ];

    console.log('resultAttributesList', resultAttributesList);

    // Get all collection tokens attributes.
    const qResult = await this.dataSource.query(
      `SELECT attributes_v1 FROM tokens WHERE
        attributes_v1 IS NOT NULL
        AND attributes_v1 != '{}'::jsonb
        AND collection_id = ${collectionId};`
    );

    if (!qResult) {
      return resultAttributesList;
    }

    console.log('qResult', qResult);

    // Tokens iteration
    qResult.forEach(({ attributes_v1: tokenAttributes }) => {
      // Token attributes iteration
      Object.entries(tokenAttributes).forEach(
        ([attributeKey, rawAttributeValueObj]: [string, RawAttributeValue]) => {
          const attributeValues =
            this.normalizeAttributeValueObj(rawAttributeValueObj);

          // Normalized token attributes iteration (multiselect gives us another array)
          attributeValues.forEach((attributeValueObj) => {
            const attribute = this.getAttributeByKey(
              resultAttributesList,
              attributeKey
            );

            const valueIndex = this.getAttributeValueIndex(
              attribute,
              attributeValueObj
            );

            // Increment count for exact attribute and value
            attribute.values[valueIndex].tokens_count += 1;
          });
        }
      );
    });

    return resultAttributesList;
  }

  @SentryWrapper({ data: [], count: 0 })
  public async getCollectionAttributes(
    queryArgs: AttributesV1QueryArgs
  ): Promise<IDataListResponse<AttributeV1DTO>> {
    const result = {
      data: [] as AttributeV1DTO[],
      count: 0,
    };

    console.log('queryArgs', queryArgs);

    const collectionId = queryArgs.where.collection_id._eq;

    console.log('collectionId', collectionId);

    const qResult = await this.dataSource.query(
      `SELECT attributes_schema FROM collections WHERE collection_id = ${collectionId}`
    );

    console.log('qResult', qResult);

    const collection = qResult[0];
    if (!collection) {
      return result;
    }

    const { attributes_schema: attributesSchema } = collection;

    result.data = await this.collectTokenCounts(collectionId, attributesSchema);

    result.count = result.data.length;

    return result;
  }
}
