import { Collections } from '@entities/Collections';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGQLQueryArgs } from '../utils/gql-query-args';
import { SentryWrapper } from '../utils/sentry.decorator';
import { AttributeDTO, AttributeValue } from './attribute.dto';
import { AttributesQueryArgs } from './attributes.resolver.types';

class RawAttributeValue {
  isArray: boolean;
  isEnum: boolean;
  value: object;
  rawValue: object | number | number[];
}
@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Collections)
    private repository: Repository<Collections>,
  ) {}

  private getDefaultAttributesData(attributesSchema) {
    return Object.entries(attributesSchema).map(
      ([attrKey, attrDescriptor]: [
        string,
        { name: string | object; enumValues?: object },
      ]) => {
        const { name, enumValues } = attrDescriptor;

        const attribute = {
          key: String(attrKey),
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

  private normalizeAttributeValueObj(
    rawAttributeValueObj: RawAttributeValue,
  ): AttributeValue {
    const { value, rawValue } = rawAttributeValueObj;
    return {
      value: JSON.stringify(value),
      raw_value: JSON.stringify(rawValue),
      tokens_count: 0,
    };
  }

  private async collectTokenCounts(
    collectionId: number,
    defaultAttributesData: AttributeDTO[],
  ): Promise<AttributeDTO[]> {
    const resultAttributesData = [...defaultAttributesData];

    // todo: use DataSource?
    // Get attributes values for each token and attribute
    const qResult = await this.repository.query(
      `SELECT attributes FROM tokens 
      WHERE
        attributes IS NOT NULL 
        AND attributes != '{}'::jsonb
        AND collection_id = ${collectionId};`,
    );

    qResult.forEach(({ attributes: tokenAttributes }) => {
      // console.log(tokenAttributes);

      Object.entries(tokenAttributes).forEach(
        ([attributeKey, rawAttributeValueObj]: [string, RawAttributeValue]) => {
          // console.log(rawAttributeValueObj);

          const { isArray } = rawAttributeValueObj;
          const attributeValueObj =
            this.normalizeAttributeValueObj(rawAttributeValueObj);

          // console.log(rawValue);

          if (isArray) {
            // multiselect
            // todo: process every array value
          } else {
            const attribute = this.getAttributeByKey(
              resultAttributesData,
              attributeKey,
            );

            const valueIndex = this.getAttributeValueIndex(
              attribute,
              attributeValueObj,
            );

            attribute.values[valueIndex].tokens_count += 1;
          }
        },
      );
    });

    return resultAttributesData;
  }

  @SentryWrapper({ data: [], count: 0 })
  public async getCollectionAttributes(
    queryArgs: AttributesQueryArgs,
    // ): Promise<IDataListResponse<AttributeDTO>> {
  ) {
    const result = {
      data: [] as AttributeDTO[],
      count: 0,
    };

    const collectionId = queryArgs.where.collection_id._eq;

    // Get collection attributes schema
    const collection = await this.repository.findOne({
      // @ts-ignore - some problem with typing...
      select: { attributes_schema: true },
      where: { collection_id: collectionId },
    });

    if (!collection) {
      return result;
    }

    const { attributes_schema: attributesSchema } = collection;

    const defaultAttributesData =
      this.getDefaultAttributesData(attributesSchema);

    result.data = await this.collectTokenCounts(
      collectionId,
      defaultAttributesData,
    );
    result.count = result.data.length;

    // console.log(result.data);

    return result;
  }
}
