/* eslint-disable @typescript-eslint/ban-ts-comment */

import { Sdk } from '@unique-nft/substrate-client';
import '@unique-nft/substrate-client/tokens';
import '@unique-nft/substrate-client/extrinsics';
import { expect } from 'chai';

export async function createToken(
  sdk: Sdk,
  address: string,
  args,
  checkResult = false,
): Promise<number> {
  const { tokenId } = (await sdk.tokens.create.submitWaitResult(args)).parsed!;
  if (checkResult) {
    expect(tokenId).to.be.a('number');
  }
  return tokenId;
}

export const defaultTokenRequest = (
  collectionId: number,
  address: string,
  owner?: string,
  name = 'Hello!',
) => ({
  address,
  collectionId,
  data: {
    image: {
      urlInfix: 'string',
      hash: 'string',
    },
    encodedAttributes: {
      0: 0,
      1: [0, 1],
    },
    name: {
      _: name,
    },
    audio: {
      urlInfix: 'string',
      hash: 'string',
    },
    description: {
      _: 'description',
    },
    imagePreview: {
      urlInfix: 'string',
      hash: 'string',
    },
    spatialObject: {
      urlInfix: 'string',
      hash: 'string',
    },
    video: {
      urlInfix: 'string',
      hash: 'string',
    },
    token_name: {
      _: 'asdfasdfasdf',
    },
  },
  owner: owner || address,
});
