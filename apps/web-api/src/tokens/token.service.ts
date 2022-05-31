import { Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseService } from '../utils/base.service';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { TokenDTO } from './token.dto';

@Injectable()
export class TokenService extends BaseService<Tokens, TokenDTO> {
  constructor(@InjectRepository(Tokens) private repo: Repository<Tokens>) {
    super();
  }

  public async find(
    queryArgs: IGQLQueryArgs<TokenDTO>,
  ): Promise<IDataListResponse<TokenDTO>> {
    const qb = this.repo.createQueryBuilder();

    this.applyFilters(qb, queryArgs);
    const data = await qb.getRawMany();
    const count = await qb.getCount();

    return { data, count };
  }

  public getByCollectionId(id: number) {
    const qb = this.repo.createQueryBuilder();

    this.applyFilters(qb, {
      where: { collection_id: { _eq: id } },
      limit: 1000, // because default 10
    });

    return qb.getRawMany();
  }

  private applyFilters(
    qb: SelectQueryBuilder<Tokens>,
    queryArgs: IGQLQueryArgs<TokenDTO>,
  ): void {
    this.select(qb);
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);
  }

  private select(qb: SelectQueryBuilder<TokenDTO>): void {
    qb.select('Tokens.collection_id', 'collection_id');
    qb.addSelect('Tokens.token_id', 'token_id');
    qb.addSelect('Tokens.data', 'data');
    qb.addSelect('Tokens.owner', 'owner');
    qb.addSelect('Tokens.owner_normalized', 'owner_normalized');
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
  }
}
