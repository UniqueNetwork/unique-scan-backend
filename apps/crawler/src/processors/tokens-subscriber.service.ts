import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Tokens } from '@entities/Tokens';
import { SdkService } from '../sdk.service';
import { ProcessorService } from './processor.service';
import { TokenInfo } from '@unique-nft/sdk/types';
import { EventName } from '@common/constants';
import { normalizeSubstrateAddress, parseNestingAddress } from '@common/utils';

@Injectable()
export class TokensSubscriberService {
  private readonly logger = new Logger(TokensSubscriberService.name);

  constructor(
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
    private processorService: ProcessorService,
    private sdkService: SdkService,
  ) {
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
  ): Promise<TokenInfo | null> {
    const result = await this.sdkService.getToken(collectionId, tokenId);

    return result ? result : null;
  }

  prepareDataToWrite(sdkEntity) {
    const {
      id: token_id,
      collectionId: collection_id,
      owner,
      properties: { constData: data = {} } = {},
    } = sdkEntity;

    const parsedNestingAddress = parseNestingAddress(owner);
    const parent_id = parsedNestingAddress
      ? `${parsedNestingAddress.collectionId}_${parsedNestingAddress.tokenId}`
      : null;

    return {
      token_id,
      collection_id,
      owner,
      owner_normalized: normalizeSubstrateAddress(owner),
      data,
      parent_id,
    };
  }
}
