import { ITokenEntities, Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { nesting } from '@unique-nft/utils/address';
import { EventMethod, EventSection, JOIN_TYPE } from '@common/constants';
import { TokenEventDTO } from './token-event.dto';
import { IDataListResponse, IGQLQueryArgs } from '../utils/gql-query-args';
import { GraphQLResolveInfo } from 'graphql';
import { BaseService } from '../utils/base.service';
import { Event } from '@entities/Event';
import { EventDTO } from './event.dto';
import { IRelations } from '../utils/base.service.types';

type ITokenInfo = Pick<
  Tokens,
  'token_id' | 'collection_id' | 'token_name' | 'image'
>;

interface IEventTransferValues {
  to: {
    value: string;
  };
  from: {
    value: string;
  };
  toToken?: {
    collectionId: number;
    tokenId: number;
  };
  tokens?: ITokenInfo[];
  tokenId: number;
  collectionId: number;
}

const EXTRINSIC_RELATION_ALIAS = 'Extrinsic';
const TOKEN_RELATION_ALIAS = 'Tokens';

const aliasFields = {
  action: 'method',
  author: 'signer',
  result: 'success',
};

const relationsFields = {
  author: EXTRINSIC_RELATION_ALIAS,
  result: EXTRINSIC_RELATION_ALIAS,
  fee: EXTRINSIC_RELATION_ALIAS,
  type: TOKEN_RELATION_ALIAS,
  token_name: TOKEN_RELATION_ALIAS,
};

const customQueryFields = {
  collection_id: `"Event"."values"->>'collectionId'`,
  token_id: `"Event"."values"->>'tokenId'`,
};

@Injectable()
export class TokenEventService extends BaseService<Event, EventDTO> {
  constructor(
    @InjectRepository(Tokens) private tokenRepo: Repository<Tokens>,
    @InjectRepository(Event) private repo: Repository<Event>,
  ) {
    super({ aliasFields, relationsFields, customQueryFields });
  }

  protected getConditionField(
    qb: SelectQueryBuilder<Event>,
    field: string,
  ): string {
    if (field === 'collection_id') {
      return `"${qb.alias}"."values"->>'collectionId'`;
    }

    if (field === 'token_id') {
      return `"${qb.alias}"."values"->>'tokenId'`;
    }

    return super.getConditionField(qb, field);
  }

  public async mapEventData(events: TokenEventDTO[]) {
    for (const event of events) {
      // nesting token to another token
      const values = event.values as unknown as IEventTransferValues;

      if (!values) {
        break;
      }

      switch (event.action) {
        case EventMethod.TRANSFER:
          const toToken = this.nestingAddressToIds(values.to.value);
          const tokensToFind: {
            collection_id: number;
            token_id: number;
          }[] = [];

          if (values.collectionId && values.tokenId) {
            tokensToFind.push({
              token_id: values.tokenId,
              collection_id: values.collectionId,
            });
          }

          if (toToken) {
            tokensToFind.push({
              collection_id: toToken.collectionId,
              token_id: toToken.tokenId,
            });

            values.toToken = toToken;
          }

          values.tokens = await this.findTokens(tokensToFind);

          event.values = values;
          break;

        case EventMethod.ITEM_CREATED:
        case EventMethod.ITEM_DESTROYED:
          values.tokens = await this.findTokens([
            {
              collection_id: values.collectionId,
              token_id: values.tokenId,
            },
          ]);
          break;
      }
    }

    return events;
  }

  private async findTokens(args: ITokenEntities[]): Promise<ITokenInfo[]> {
    const qb = this.tokenRepo.createQueryBuilder();
    qb.select([
      'token_id',
      'collection_id::int',
      'token_name',
      'image',
      'type',
    ]);
    qb.addSelect(`SUBSTRING(token_name from '([^\\s]+)')`, 'token_prefix');
    qb.where(args);

    return qb.getRawMany();
  }

  private nestingAddressToIds(address: string) {
    try {
      return nesting.addressToIds(address);
    } catch {
      return null;
    }
  }

  public async find(
    queryArgs: IGQLQueryArgs<Partial<TokenEventDTO>>,
    queryInfo: GraphQLResolveInfo,
  ): Promise<IDataListResponse<TokenEventDTO>> {
    const qb = this.repo.createQueryBuilder();

    const queryFields = this.getQueryFields(queryInfo);

    const relations = {
      [EXTRINSIC_RELATION_ALIAS]: {
        table: 'extrinsic',
        on: `"${EXTRINSIC_RELATION_ALIAS}".block_index = "Event".block_index`,
        join: JOIN_TYPE.INNER,
      },
      [TOKEN_RELATION_ALIAS]: {
        table: 'tokens',
        on: `
          "${TOKEN_RELATION_ALIAS}".token_id = ("${qb.alias}"."values"->>'tokenId')::int and
          "${TOKEN_RELATION_ALIAS}".collection_id = ("${qb.alias}"."values"->>'collectionId')::int`,
      },
    } as IRelations;

    this.applySelect(qb, queryArgs, queryFields, relations);

    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyOrderCondition(qb, queryArgs);

    qb.andWhere({
      phase: Not('Initialization'),
      section: EventSection.COMMON,
      method: In([
        EventMethod.ITEM_CREATED,
        EventMethod.TRANSFER,
        EventMethod.ITEM_DESTROYED,
      ]),
    });

    return this.getDataAndCount(qb, queryArgs);
  }
}
