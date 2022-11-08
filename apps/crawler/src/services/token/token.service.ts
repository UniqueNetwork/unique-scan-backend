import {
  EventName,
  SubscriberAction,
  TOKEN_BURN_EVENTS,
  TOKEN_UPDATE_EVENTS,
} from '@common/constants';
import {
  normalizeSubstrateAddress,
  normalizeTimestamp,
  sanitizePropertiesValues,
} from '@common/utils';
import { Event } from '@entities/Event';
import { Tokens, TokenType, ITokenEntities } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SdkService } from '../../sdk/sdk.service';
import {
  IBlockCommonData,
  IEvent,
} from '../../subscribers/blocks.subscriber.service';
import { TokenNestingService } from './nesting.service';
import { TokenData } from './token.types';

// todo: performance
import { PerformanceObserver, performance } from 'node:perf_hooks';
const obs = new PerformanceObserver((items) => {
  for (const i of items.getEntries()) {
    const { name, duration } = i;
    console.log(`${name}: ${duration}`);
  }
  // console.log(items.getEntries()[0].duration);
  // performance.clearMarks();
});

@Injectable()
export class TokenService {
  constructor(
    private sdkService: SdkService,
    private nestingService: TokenNestingService,
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
  ) {}

  private async getTokenData(
    collectionId: number,
    tokenId: number,
    blockHash: string,
  ): Promise<TokenData | null> {
    let tokenDecoded = await this.sdkService.getToken(collectionId, tokenId);

    if (!tokenDecoded) {
      tokenDecoded = await this.sdkService.getToken(
        collectionId,
        tokenId,
        blockHash,
      );
    }

    if (!tokenDecoded) {
      return null;
    }

    // TODO: delete after rft support
    if (tokenDecoded.owner === '') {
      return null;
    }

    const [tokenProperties, isBundle] = await Promise.all([
      this.sdkService.getTokenProperties(collectionId, tokenId),
      this.sdkService.isTokenBundle(collectionId, tokenId),
    ]);

    return {
      tokenDecoded,
      tokenProperties,
      isBundle,
    };
  }

  async prepareDataForDb(
    tokenData: TokenData,
    blockHash: string,
    blockTimestamp?: number,
    needCheckNesting = false,
  ): Promise<Omit<Tokens, 'id'>> {
    const { tokenDecoded, tokenProperties, isBundle } = tokenData;

    const {
      tokenId: token_id,
      collectionId: collection_id,
      image,
      attributes,
      nestingParentToken,
      owner,
    } = tokenDecoded;

    const { owner: collectionOwner, tokenPrefix } = tokenDecoded.collection;

    const token = await this.tokensRepository.findOneBy({
      collection_id,
      token_id,
    });

    let tokenType = TokenType.NFT;
    let parentId = null;
    if (nestingParentToken) {
      const { collectionId, tokenId } = nestingParentToken;
      parentId = `${collectionId}_${tokenId}`;
      tokenType = TokenType.NESTED;
    }

    const children: ITokenEntities[] = needCheckNesting
      ? await this.nestingService.handleNesting(
          tokenData,
          blockHash,
          blockTimestamp,
        )
      : token?.children ?? [];

    if (isBundle) {
      tokenType = TokenType.NESTED;
    }

    if (!children.length && !parentId) {
      tokenType = TokenType.NFT;
    }

    return {
      token_id,
      collection_id,
      owner,
      owner_normalized: normalizeSubstrateAddress(owner),
      image,
      attributes,
      properties: tokenProperties.properties
        ? sanitizePropertiesValues(tokenProperties.properties)
        : [],
      parent_id: parentId,
      is_sold: owner !== collectionOwner,
      token_name: `${tokenPrefix} #${token_id}`,
      burned: token?.burned ?? false,
      type: tokenType,
      children,
      bundle_created: tokenType === TokenType.NFT ? null : undefined,
    };
  }

  async batchProcess({
    events,
    blockCommonData,
  }: {
    events: Event[];
    blockCommonData: IBlockCommonData;
  }) {
    obs.observe({ type: 'measure' });
    performance.mark('start');

    console.log('Total events', events.length);

    let count = 0;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      // const mark = `event-${count}`;
      // performance.mark(mark);

      const { section, method } = event;
      const eventName = `${section}.${method}`;

      const action = TOKEN_UPDATE_EVENTS.includes(eventName)
        ? SubscriberAction.UPSERT
        : TOKEN_BURN_EVENTS.includes(eventName)
        ? SubscriberAction.DELETE
        : null;

      if (action) {
        count++;

        const { values } = event;
        const { collectionId, tokenId } = values as unknown as {
          collectionId: number;
          tokenId: number;
        };
        const { blockHash, blockTimestamp } = blockCommonData;

        if (action === SubscriberAction.UPSERT) {
          await this.update({
            collectionId,
            tokenId,
            eventName,
            blockTimestamp,
            blockHash,
          });
        } else {
          // todo: Изучить что там с burn и at
          await this.burn(collectionId, tokenId);
        }
      }
      // performance.measure(mark, mark);
    }

    console.log('Total count', count);
    performance.measure('Start to End', 'start');

    // performance.clearMarks();
    // performance.clearMeasures();
    // obs.disconnect();
  }

  async update({
    collectionId,
    tokenId,
    eventName,
    blockTimestamp,
    blockHash,
  }: {
    collectionId: number;
    tokenId: number;
    eventName: string;
    blockTimestamp: number;
    blockHash: string;
  }): Promise<SubscriberAction> {
    const tokenData = await this.getTokenData(collectionId, tokenId, blockHash);

    let result;

    if (tokenData) {
      const needCheckNesting = eventName === EventName.TRANSFER;
      const preparedData = await this.prepareDataForDb(
        tokenData,
        blockHash,
        blockTimestamp,
        needCheckNesting,
      );

      // Write token data into db
      await this.tokensRepository.upsert(
        {
          ...preparedData,
          date_of_creation:
            eventName === EventName.ITEM_CREATED
              ? normalizeTimestamp(blockTimestamp)
              : undefined,
        },
        ['collection_id', 'token_id'],
      );

      result = SubscriberAction.UPSERT;
    } else {
      // No entity returned from sdk. Most likely it was destroyed in a future block.
      await this.burn(collectionId, tokenId);

      result = SubscriberAction.DELETE;
    }

    return result;
  }

  async burn(collectionId: number, tokenId: number) {
    return this.tokensRepository.update(
      {
        collection_id: collectionId,
        token_id: tokenId,
      },
      {
        burned: true,
      },
    );
  }
}
