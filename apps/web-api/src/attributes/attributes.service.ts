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

    const attributesSchema = collection?.attributes_schema;
    if (!attributesSchema) {
      // todo: Exit with no data
      return result;
    }

    result.data = Object.entries(attributesSchema).map(([key, descriptor]) => {
      const { name, enumValues } = descriptor;
      const attribute = {
        key,
        name: name._,
        values: [],
      } as AttributeDTO;

      if (enumValues) {
        console.log(enumValues);
        attribute.values = Object.entries(enumValues).map(
          ([enumKey, name]: [string, { _: string }]) => ({
            raw_value: enumKey,
            value: name?._,
            tokens_count: 0,
          }),
        );
      }

      console.log(attribute);

      return attribute;
    });

    result.count = result.data.length;

    // console.log(attributesSchema);

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

    // tokenAttributes.forEach((row) => {
    //   const {
    //     key,
    //     value: { name, value, rawValue, isEnum, isArray },
    //   } = row;

    //   // console.log(row);
    // });

    console.log(result.data);
    console.log(result);

    return result;
  }
}
