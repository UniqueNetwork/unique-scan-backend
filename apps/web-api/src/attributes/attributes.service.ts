import { Collections } from '@entities/Collections';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGQLQueryArgs } from '../utils/gql-query-args';
import { SentryWrapper } from '../utils/sentry.decorator';
import { AttributeDTO } from './attribute.dto';
import { AttributesQueryArgs } from './attributes.resolver.types';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Collections)
    private repository: Repository<Collections>,
  ) {}

  private getDefaultAttributesData(attributesSchema) {
    return Object.entries(attributesSchema).map(
      ([attributeKey, descriptor]: [
        string,
        { name: { _: string }; enumValues?: object },
      ]) => {
        const { name, enumValues } = descriptor;

        const attribute = {
          key: attributeKey,
          name: name._,
          values: [],
        } as AttributeDTO;

        if (enumValues) {
          attribute.values = Object.entries(enumValues).map(
            ([enumKey, name]: [string, { _: string }]) => ({
              raw_value: enumKey,
              value: name?._,
              tokens_count: 0,
            }),
          );
        }

        return attribute;
      },
    );
  }

  private async collectTokenCounts(
    collectionId: number,
    defaultAttributesData: AttributeDTO[],
  ): Promise<AttributeDTO[]> {
    const resultAttributesData = [...defaultAttributesData];

    // Get attributes values for each token and attribute
    const tokenAttributes = await this.repository.query(
      `WITH token_attributes AS (SELECT
          token_id,
          (jsonb_each(attributes)).*
        FROM tokens WHERE
          attributes IS NOT NULL 
          AND attributes != '{}'::jsonb
          AND collection_id = ${collectionId}
        )
        
        SELECT * FROM token_attributes;`,
    );

    // todo: FROM HERE

    tokenAttributes.forEach((row) => {
      const {
        key: attributeKey,
        value: { isEnum, isArray, rawValue },
      } = row;

      // console.log(row);
      // console.log(rawValue);

      let resultRawValue;
      if (isArray) {
        // multiselect
        // todo: process every array value
      } else if (isEnum) {
        resultRawValue = rawValue;
      } else {
        // text
        resultRawValue = rawValue._;
      }

      // todo: remove me when isArray processed
      if (resultRawValue != undefined) {
        const attribute = resultAttributesData.find(
          ({ key }) => key == attributeKey,
        );
        console.log(attributeKey, resultRawValue);
        if (!attribute.values[resultRawValue]) {
          attribute.values[resultRawValue] = {
            value: resultRawValue,
            raw_value: resultRawValue,
            tokens_count: 0,
          };
        }

        attribute.values[resultRawValue].tokens_count += 1;
      }
    });

    console.log(resultAttributesData[0].values);
    console.log(resultAttributesData[1].values);

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

    result.data = await this.collectTokenCounts(
      collectionId,
      this.getDefaultAttributesData(attributesSchema),
    );
    result.count = result.data.length;

    // console.log(result.data);

    return result;
  }
}
