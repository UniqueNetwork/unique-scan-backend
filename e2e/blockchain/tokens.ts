/* eslint-disable @typescript-eslint/ban-ts-comment */

import { Sdk } from '@unique-nft/substrate-client';
import {
  CreateTokenArguments,
  SignTxResult,
  SubmitTxArguments,
  UnsignedTxPayload,
} from '@unique-nft/substrate-client/types';
import '@unique-nft/substrate-client/tokens';
import '@unique-nft/substrate-client/extrinsics';

export async function createToken(
  sdk: Sdk,
  address: string,
  collectionId: number,
): Promise<number> {
  const constData = {
    text_required: 'required text',
    text_optional: 'optional text',
  };

  const createArgs: CreateTokenArguments = {
    address,
    owner: address,
    collectionId,
    constData,
  };
  const txPayload: UnsignedTxPayload = await sdk.tokens.create(createArgs);

  const signTxResult: SignTxResult = await sdk.extrinsics.sign(txPayload);

  const submitTxArgs: SubmitTxArguments = {
    signerPayloadJSON: txPayload.signerPayloadJSON,
    signature: signTxResult.signature,
  };

  return new Promise(async (resolve) => {
    const submittableResult = await sdk.extrinsics.submitWaitCompleted(
      submitTxArgs,
    );
    let tokenId: number;
    if (submittableResult.isCompleted) {
      const createdEvent = submittableResult.findRecord(
        'common',
        'ItemCreated',
      );
      const value = createdEvent.event.data[1];
      // @ts-ignore
      tokenId = value.toNumber();
      resolve(tokenId);
    }
  });
}
