import { Injectable, Logger } from '@nestjs/common';
import { Reader } from '@unique-nft/harvester';
import { EventName } from '@common/constants';
import { TokenService } from '../services/token/token.service';

@Injectable()
export class TokenReScanner {
  logger = new Logger(TokenReScanner.name);

  constructor(private reader: Reader, private tokenService: TokenService) {}

  async rescanTokens(
    collectionId: number,
    tokenIds: number[],
    blockNumber: number,
  ): Promise<void> {
    this.logger.log(
      `Going to force rescan tokens for collection ${collectionId} and tokens: ${tokenIds.join(
        ', ',
      )}`,
    );

    const block = await this.reader.getBlock(blockNumber);

    for (const tokenId of tokenIds) {
      try {
        this.logger.log(`Rescan for token ${collectionId}/${tokenId}`);

        await this.tokenService.update({
          blockNumber: block.id,
          collectionId,
          tokenId,
          eventName: EventName.TOKEN_PROPERTY_SET,
          blockTimestamp: block.timestamp.getTime(),
          blockHash: block.hash,
          data: [],
        });

        this.logger.log(`Rescan for token ${collectionId}/${tokenId} finished`);
      } catch (e: any) {
        this.logger.error(
          `Rescan for token ${collectionId}/${tokenId} failed: ${e.message}; ${e.stack}`,
        );
      }
    }
  }
}
