import { ITokenEntities, Tokens } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nesting } from '@unique-nft/utils/address';
import { EventMethod } from '@common/constants';
import { TokenEventDTO } from './token-event.dto';

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

@Injectable()
export class TokenEventService {
  constructor(@InjectRepository(Tokens) private repo: Repository<Tokens>) {}

  public async mapEventData(events: TokenEventDTO[]) {
    for (const event of events) {
      // nesting token to another token
      if (event.action === EventMethod.TRANSFER) {
        const values = event.values as unknown as IEventTransferValues;
        const toToken = this.nestingAddressToIds(values.to.value);

        if (toToken) {
          const tokens = await this.findTokens([
            {
              collection_id: values.collectionId,
              token_id: values.tokenId,
            },
            {
              collection_id: toToken.collectionId,
              token_id: toToken.tokenId,
            },
          ]);

          values.toToken = toToken;
          values.tokens = tokens;
        }

        event.values = values;
      }
    }

    return events;
  }

  private async findTokens(args: ITokenEntities[]): Promise<ITokenInfo[]> {
    const qb = this.repo.createQueryBuilder();
    qb.select(['token_id', 'collection_id::int', 'token_name', 'image']);
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
}
