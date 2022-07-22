import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Tokens } from '@entities/Tokens';
import { SdkService } from '../sdk.service';
import { ProcessorService } from './processor.service';
import { EventName } from '@common/constants';
import { normalizeSubstrateAddress, parseNestingAddress } from '@common/utils';
import ISubscriberService from './subscriber.interface';
import { TokenDecoded } from '@unique-nft/sdk/tokens';

@Injectable()
export class TokensSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(TokensSubscriberService.name);

  constructor(
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
    private processorService: ProcessorService,
    private sdkService: SdkService,
  ) {}

  subscribe() {
    const EVENTS_TO_UPDATE = [
      // Insert
      EventName.ITEM_CREATED,

      // Update
      EventName.TRANSFER,

      // todo: Or maybe these events are reletad to collection?
      EventName.TOKEN_PROPERTY_SET,
      EventName.TOKEN_PROPERTY_DELETED,
    ];

    EVENTS_TO_UPDATE.forEach((eventName) =>
      this.processorService.processor.addEventHandler(
        eventName,
        this.upsertHandler.bind(this),
      ),
    );

    this.processorService.processor.addEventHandler(
      EventName.ITEM_DESTROYED,
      this.destroyHandler.bind(this),
    );
  }

  private async getTokenData(
    collectionId: number,
    tokenId: number,
  ): Promise<TokenDecoded | null> {
    const result = await this.sdkService.getToken(collectionId, tokenId);

    return result ? result : null;
  }

  prepareDataToWrite(sdkEntity: TokenDecoded) {
    console.log(sdkEntity);
    const {
      tokenId: token_id,
      collectionId: collection_id,
      image,
      attributes,
      parent,
    } = sdkEntity;

    const {
      owner: rawOwner,
    }: { owner: { Ethereum?: string; Substrate?: string } } = sdkEntity;

    const owner = rawOwner?.Ethereum || rawOwner?.Substrate;
    console.log('rawOwner', collection_id, token_id, rawOwner, parent);
    // const parsedNestingAddress = parseNestingAddress(owner);
    // const parent_id = parsedNestingAddress
    //   ? `${parsedNestingAddress.collectionId}_${parsedNestingAddress.tokenId}`
    //   : null;

    // if (parent_id) {
    //   console.log('Added parent_id', parent_id);
    // }

    return {
      token_id,
      collection_id,
      owner,
      owner_normalized: normalizeSubstrateAddress(owner),
      data: {
        image: image.fullUrl,
        attributes: Object.fromEntries(
          Object.values(attributes).map(({ name, value }) => [name, value]),
        ),
      },
      // parent_id,
    };
  }

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: blockTimestamp },
      event: { name: eventName, args },
    } = ctx;

    // console.log('ctx.event', ctx.event);
    // console.log('eventName', eventName);
    // console.log('args', args);

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      entity: null as null | object | string,
      collectionId: null as null | number,
      tokenId: null as null | number,
    };

    try {
      const [collectionId, tokenId] = args as [number, number];

      log.collectionId = collectionId;
      log.tokenId = tokenId;

      if (tokenId === 0) {
        throw new Error('Bad tokenId');
      }

      // ! DEBUG
      // if (
      //   ![829, 835, 836, 901, 902, 908, 909, 921, 922, 926, 927, 936].includes(
      //     collectionId,
      //   )
      // ) {
      //   return;
      // }

      const tokenData = await this.getTokenData(collectionId, tokenId);

      if (tokenData) {
        const dataToWrite = this.prepareDataToWrite(tokenData);

        log.entity = dataToWrite;

        // Write collection data into db
        await this.tokensRepository.upsert(
          {
            ...dataToWrite,
            date_of_creation:
              eventName === EventName.ITEM_CREATED ? blockTimestamp : undefined,
          },
          ['collection_id', 'token_id'],
        );
      } else {
        // No entity returned from sdk. Most likely it was destroyed in a future block.
        log.entity = null;

        // Delete db record
        await this.tokensRepository.delete({
          collection_id: collectionId,
          token_id: tokenId,
        });
      }

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }

  private async destroyHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: blockTimestamp },
      event: { name: eventName, args },
    } = ctx;

    // console.log('ctx.event', ctx.event);
    // console.log('eventName', eventName);
    // console.log('args', args);

    const log = {
      eventName,
      blockNumber,
      blockTimestamp,
      collectionId: null as null | number,
      tokenId: null as null | number,
    };

    try {
      const [collectionId, tokenId] = args as [number, number];

      log.collectionId = collectionId;
      log.tokenId = tokenId;

      // Delete db record
      await this.tokensRepository.delete({
        collection_id: collectionId,
        token_id: tokenId,
      });

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }
}
