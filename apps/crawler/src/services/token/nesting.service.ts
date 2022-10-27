import { Tokens, TokenType, ITokenChild } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NestedToken } from '@unique-nft/substrate-client/tokens';
import { SentryService } from '@ntegral/nestjs-sentry';
import { normalizeTimestamp } from '@common/utils';
import { Repository } from 'typeorm';
import { SdkService } from '../../sdk/sdk.service';
import { TokenData } from './token.types';

@Injectable()
export class TokenNestingService {
  constructor(
    private sdkService: SdkService,
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
    private dataSource: DataSource,
    private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(TokenNestingService.name);
  }

  async handleNesting(
    tokenData: TokenData,
    blockHash: string,
    blockTimestamp?: number,
  ) {
    const { tokenDecoded, isBundle } = tokenData;

    const {
      tokenId: token_id,
      collectionId: collection_id,
      nestingParentToken,
    } = tokenDecoded;
    const tokenFromDb = await this.tokensRepository.findOneBy({
      collection_id,
      token_id,
    });
    let children: ITokenChild[] = [];
    try {
      // token nested. Update children. Update parent.
      if (isBundle) {
        const nestingBundle = await this.sdkService.getTokenBundle(
          collection_id,
          token_id,
        );

        children = this.getTokenChildren(
          collection_id,
          token_id,
          nestingBundle,
        );

        await this.updateTokenParents(
          collection_id,
          token_id,
          nestingBundle,
          blockHash,
          blockTimestamp,
        );
      }

      // token was nested. Remove token from parents children.
      if (tokenFromDb?.parent_id && !isBundle) {
        await this.removeTokenFromParents(collection_id, token_id);
      }

      let parentId = null;
      if (nestingParentToken) {
        const { collectionId, tokenId } = nestingParentToken;
        parentId = `${collectionId}_${tokenId}`;
      }

      // The token bundle has been unnested. Remove all children from old parents
      if (tokenFromDb?.parent_id && isBundle && !parentId) {
        await this.unnestBundle(tokenFromDb, [
          ...tokenFromDb.children,
          {
            token_id,
            collection_id,
          },
        ]);
      }

      return children;
    } catch {
      return children;
    }
  }

  private async unnestBundle(
    token: Tokens,
    childrenToBeDeleted: ITokenChild[],
  ) {
    const { parent_id, children } = token;
    if (parent_id && children.length) {
      const [collectionId, tokenId] = parent_id?.split('_');

      const parent = await this.tokensRepository.findOneBy({
        collection_id: Number(collectionId),
        token_id: Number(tokenId),
      });

      if (parent) {
        const childrenSet = new Set<string>(
          childrenToBeDeleted.map(
            ({ collection_id, token_id }) => `${collection_id}_${token_id}`,
          ),
        );

        await this.tokensRepository.update(
          { id: parent.id },
          {
            children: parent.children.filter(
              ({ collection_id, token_id }) =>
                !childrenSet.has(`${collection_id}_${token_id}`),
            ),
          },
        );

        if (parent.parent_id) {
          await this.unnestBundle(parent, childrenToBeDeleted);
        }
      }
    }
  }

  private async updateTokenParents(
    collection_id: number,
    token_id: number,
    nestingBundle: NestedToken,
    blockHash: string,
    blockTimestamp?: number,
  ) {
    try {
      const parent = await this.sdkService.getTokenParents(
        collection_id,
        token_id,
      );

      if (parent) {
        await this.updateParent(
          parent.collectionId,
          parent.tokenId,
          nestingBundle,
          blockTimestamp,
        );

        await this.updateTokenParents(
          parent.collectionId,
          parent.tokenId,
          nestingBundle,
          blockHash,
          blockTimestamp,
        );
      }
    } catch (error) {
      this.sentry.instance().captureException({ error });
    }
  }

  private async updateParent(
    collection_id: number,
    token_id: number,
    nestingBundle: NestedToken,
    blockTimestamp?: number,
  ) {
    const children = this.getTokenChildren(
      collection_id,
      token_id,
      nestingBundle,
    );

    if (children.length) {
      await this.tokensRepository.update(
        {
          token_id,
          collection_id,
        },
        {
          children,
          type: TokenType.NESTED,
          bundle_created: blockTimestamp
            ? normalizeTimestamp(blockTimestamp)
            : undefined,
        },
      );
    }
  }

  private async removeTokenFromParents(
    collection_id: number,
    token_id: number,
  ) {
    const parents = await this.getParentsByChildren(collection_id, token_id);

    for (const parent of parents) {
      await this.removeChildFromToken(parent, collection_id, token_id);
    }
  }

  private async getParentsByChildren(
    collection_id: number,
    token_id: number,
  ): Promise<
    { collection_id: number; token_id: number; children: ITokenChild[] }[]
  > {
    const query = `
      SELECT collection_id, token_id, children
      FROM tokens
      WHERE children @> '[{"token_id":${token_id}, "collection_id": ${collection_id}}]'::jsonb
    `;

    return this.dataSource.query(query);
  }

  private async removeChildFromToken(
    parent: {
      collection_id: number;
      token_id: number;
      children: ITokenChild[];
    },
    child_collection_id: number,
    child_token_id: number,
  ) {
    return this.tokensRepository.update(
      {
        collection_id: parent.collection_id,
        token_id: parent.token_id,
      },
      {
        children: parent.children.filter(
          ({ token_id, collection_id }) =>
            !(
              child_collection_id === collection_id &&
              child_token_id === token_id
            ),
        ),
      },
    );
  }

  private getTokenChildren(
    collectionId: number,
    tokenId: number,
    nestingBundle: NestedToken,
  ) {
    const nestedToken = this.getNestedTokenFromBundle(
      collectionId,
      tokenId,
      nestingBundle,
    );

    const mapNestingBundle = (
      tree: NestedToken,
    ): { collection_id: number; token_id: number }[] => {
      let result = [];
      if (tree?.nestingChildTokens) {
        result = [
          ...result,
          ...tree.nestingChildTokens.map(({ collectionId, tokenId }) => ({
            collection_id: collectionId,
            token_id: tokenId,
          })),
        ];
      }

      tree?.nestingChildTokens?.forEach((item) => {
        result = [...result, ...mapNestingBundle(item)];
      });

      return result;
    };

    return mapNestingBundle(nestedToken);
  }

  private getNestedTokenFromBundle(
    collectionId: number,
    tokenId: number,
    nestingBundle: NestedToken,
  ) {
    let token: NestedToken | null = null;
    const findTokenByArgs = (
      nestingBundle: NestedToken,
      collectionId: number,
      tokenId: number,
    ) => {
      if (
        nestingBundle.tokenId === tokenId &&
        nestingBundle.collectionId === collectionId
      ) {
        token = nestingBundle;
      }

      if (!token) {
        nestingBundle?.nestingChildTokens?.forEach((item) => {
          findTokenByArgs(item, collectionId, tokenId);
        });
      }
    };

    findTokenByArgs(nestingBundle, collectionId, tokenId);

    return token;
  }
}