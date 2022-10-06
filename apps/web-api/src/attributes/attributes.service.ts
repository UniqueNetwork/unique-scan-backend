import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { SentryWrapper } from '../utils/sentry.decorator';
import { AttributeDTO, AttributeValue } from './attribute.dto';
import { AttributesQueryArgs } from './attributes.resolver.types';
import { IDataListResponse } from '../utils/gql-query-args';

class RawAttributeValue {
  isArray: boolean;
  isEnum: boolean;
  value: object;
  rawValue: object | number | number[];
}

@Injectable()
export class AttributesService {
  constructor(private dataSource: DataSource) {}

  /**
   * Creates full list of all possible token attributes with default token_counts = 0.
   */
  private getDefaultAttributesList(attributesSchema): AttributeDTO[] {
    return Object.entries(attributesSchema).map(
      ([attrKey, attrDescriptor]: [
        string,
        { name: object; enumValues?: object },
      ]) => {
        const { name, enumValues } = attrDescriptor;

        const attribute = {
          key: attrKey,
          name: JSON.stringify(name),
          values: [],
        } as AttributeDTO;

        if (enumValues) {
          attribute.values = Object.entries(enumValues).map(
            ([enumKey, value]: [string, string | object]) => ({
              raw_value: String(enumKey),
              value: JSON.stringify(value),
              tokens_count: 0,
            }),
          );
        }

        return attribute;
      },
    );
  }

  private getAttributeByKey(
    attributesData: AttributeDTO[],
    attributeKey: string,
  ) {
    return attributesData.find(({ key }) => key == attributeKey);
  }

  /**
   * Finds in attributes list values exact attribute value and returns it's index.
   * If not found, creates new record in values and returns it's index.
   */
  private getAttributeValueIndex(
    attribute: AttributeDTO,
    attributeValueObj: AttributeValue,
  ) {
    const { raw_value: attributeRawValue } = attributeValueObj;
    let index = attribute.values.findIndex(
      ({ raw_value: currentRawValue }) => currentRawValue === attributeRawValue,
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
    rawAttributeValueObj: RawAttributeValue,
  ): AttributeValue[] {
    const result = [];
    const { value, rawValue, isArray } = rawAttributeValueObj;

    if (isArray && Array.isArray(rawValue)) {
      rawValue.forEach((rawValue, index) => {
        result.push({
          value: JSON.stringify(value[index]),
          raw_value: String(rawValue),
          tokens_count: 0,
        });
      });
    } else {
      result.push({
        value: JSON.stringify(value),
        raw_value: JSON.stringify(rawValue),
        tokens_count: 0,
      });
    }

    return result;
  }

  /**
   * Iterates through collection tokens attributes and calculates 'token_counts' for every attribute value.
   */
  private async collectTokenCounts(
    collectionId: number,
    attributesSchema: object,
  ): Promise<AttributeDTO[]> {
    // Get list of all possible attributes with default tokens_count = 0
    const resultAttributesList = [
      ...this.getDefaultAttributesList(attributesSchema),
    ];

    // Get all collection tokens attributes.
    const qResult = await this.dataSource.query(
      `SELECT attributes FROM tokens WHERE
        attributes IS NOT NULL 
        AND attributes != '{}'::jsonb
        AND collection_id = ${collectionId};`,
    );

    if (!qResult) {
      return resultAttributesList;
    }

    // Tokens iteration
    qResult.forEach(({ attributes: tokenAttributes }) => {
      // Token attributes iteration
      Object.entries(tokenAttributes).forEach(
        ([attributeKey, rawAttributeValueObj]: [string, RawAttributeValue]) => {
          const attributeValues =
            this.normalizeAttributeValueObj(rawAttributeValueObj);

          // Normalized token attributes iteration (multiselect gives us another array)
          attributeValues.forEach((attributeValueObj) => {
            const attribute = this.getAttributeByKey(
              resultAttributesList,
              attributeKey,
            );

            const valueIndex = this.getAttributeValueIndex(
              attribute,
              attributeValueObj,
            );

            // Itcrement count for exact attribute and value
            attribute.values[valueIndex].tokens_count += 1;
          });
        },
      );
    });

    return resultAttributesList;
  }

  @SentryWrapper({ data: [], count: 0 })
  public async getCollectionAttributes(
    queryArgs: AttributesQueryArgs,
  ): Promise<IDataListResponse<AttributeDTO>> {
    const result = {
      data: [] as AttributeDTO[],
      count: 0,
    };

    const collectionId = queryArgs.where.collection_id._eq;

    const qResult = await this.dataSource.query(
      `SELECT attributes_schema FROM collections WHERE collection_id = ${collectionId}`,
    );

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
