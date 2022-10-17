import { Tokens, TokenType, ITokenChild } from '@entities/Tokens';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NestedToken } from '@unique-nft/substrate-client/tokens';
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
  ) {}

  async handleNesting(tokenData: TokenData, blockHash: string) {
    const { tokenDecoded, isBundle } = tokenData;

    const { tokenId: token_id, collectionId: collection_id } = tokenDecoded;
    const tokenFromDb = await this.tokensRepository.findOneBy({
      collection_id,
      token_id,
    });
    let children: ITokenChild[] = [];
    try {
      // token nested. Update his children field. Update parent.
      if (isBundle) {
        const nestingBundle = await this.sdkService.getTokenBundle(
          collection_id,
          token_id,
          blockHash,
        );

        children = this.getTokenChildren(
          collection_id,
          token_id,
          nestingBundle,
        );

        console.log(
          'nesting children',
          collection_id,
          token_id,
          blockHash,
          children.length,
        );

        await this.updateTokenParents(
          collection_id,
          token_id,
          nestingBundle,
          blockHash,
        );
      }

      // token was nested. Remove token from parents children.
      if (tokenFromDb?.parent_id && !isBundle) {
        await this.removeTokenFromParents(collection_id, token_id);
      }

      return children;
    } catch {
      return children;
    }
  }

  private async updateTokenParents(
    collection_id: number,
    token_id: number,
    nestingBundle: NestedToken,
    blockHash: string,
  ) {
    try {
      const parent = await this.sdkService.getTokenParents(
        collection_id,
        token_id,
        blockHash,
      );

      if (parent) {
        await this.updateParent(
          parent.collectionId,
          parent.tokenId,
          nestingBundle,
        );

        await this.updateTokenParents(
          parent.collectionId,
          parent.tokenId,
          nestingBundle,
          blockHash,
        );
      }
    } catch (e) {
      console.log('updateTokenParents error: ', e);
    }
  }

  private async updateParent(
    collection_id: number,
    token_id: number,
    nestingBundle: NestedToken,
  ) {
    const children = this.getTokenChildren(
      collection_id,
      token_id,
      nestingBundle,
    );
    console.log('parent children', collection_id, token_id, children.length);
    await this.tokensRepository.update(
      {
        token_id,
        collection_id,
      },
      {
        children,
        type: TokenType.NESTED,
      },
    );
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
      FROM tokens t2, jsonb_array_elements(children) tokensList
      WHERE (tokensList->>'token_id')::int = ${token_id} AND (tokensList->>'collection_id')::int = ${collection_id}
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
            child_collection_id !== collection_id &&
            child_token_id !== token_id,
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
