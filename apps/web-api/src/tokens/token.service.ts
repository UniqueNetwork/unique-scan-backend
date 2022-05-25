import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IGQLQueryArgs } from '../utils/gql-query-args';
import { TokenDTO } from './token.dto';

@Injectable()
export class TokenService extends BaseService<Tokens, TokenDTO> {
  constructor(@InjectRepository(Tokens) private repo: Repository<Tokens>) {
    super();
  }

  public find(queryArgs: IGQLQueryArgs<TokenDTO>): Promise<TokenDTO[]> {
    const qb = this.repo.createQueryBuilder();
    qb.select('Tokens.collection_id', 'collection_id');
    qb.addSelect('Tokens.token_id', 'token_id');
    qb.addSelect('Tokens.data', 'data');
    qb.addSelect('Tokens.owner', 'owner');
    qb.addSelect(
      `COALESCE(
        "Tokens".data::json ->> 'ipfsJson'::text,
          replace(
            COALESCE(Collection.offchain_schema, ''::text),
            '{id}'::text,
            "Tokens".token_id::character varying(255)::text
          ),
        ''::text
      )`,
      'image_path',
    );
    qb.addSelect('Collection.token_prefix', 'token_prefix');
    qb.addSelect('Collection.name', 'collection_name');
    qb.addSelect('Collection.description', 'collection_description');
    qb.addSelect(
      `"Collection".variable_on_chain_schema::json ->> 'collectionCover'::text`,
      'collection_cover',
    );
    qb.leftJoin('Tokens.collection', 'Collection');
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    return qb.getRawMany();
  }

  getByCollectionId(id: number) {
    return this.find({
      where: { collection_id: { _eq: id } },
    });
  }
}
