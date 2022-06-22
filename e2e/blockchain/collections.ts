/* eslint-disable @typescript-eslint/ban-ts-comment */

import { Sdk } from '@unique-nft/sdk';
import { INamespace } from 'protobufjs';
import {
  CreateCollectionArguments,
  SignTxResult,
  SubmitTxArguments,
  UnsignedTxPayload,
} from '@unique-nft/sdk/types';
import { ISubmittableResult } from '@polkadot/types/types/extrinsic';
import '@unique-nft/sdk/tokens';
import '@unique-nft/sdk/extrinsics';

export async function createCollection(
  sdk: Sdk,
  address: string,
  {
    name = 'My collection',
    description = 'my test collection',
    tokenPrefix = 'FOO',
  },
): Promise<number> {
  const constOnChainSchema: INamespace = {
    nested: {
      onChainMetaData: {
        nested: {
          NFTMeta: {
            fields: {
              FieldA: {
                id: 1,
                rule: 'required',
                type: 'string',
              },
              FieldB: {
                id: 2,
                rule: 'required',
                type: 'string',
              },
            },
          },
        },
      },
    },
  };

  const createArgs: CreateCollectionArguments = {
    name,
    description,
    tokenPrefix,
    // @ts-ignore
    // properties: {
    //   schemaVersion: 'Unique',
    //   constOnChainSchema,
    // },
    address,
  };
  const txPayload: UnsignedTxPayload = await sdk.collections.create(createArgs);

  const signTxResult: SignTxResult = await sdk.extrinsics.sign(txPayload);

  const submitTxArgs: SubmitTxArguments = {
    signerPayloadJSON: txPayload.signerPayloadJSON,
    signature: signTxResult.signature,
  };

  return new Promise((resolve) => {
    let collectionId = 0;
    function resultCallback(result: ISubmittableResult) {
      const createdEvent = result.events.find(
        (event) => event.event.method === 'CollectionCreated',
      );
      if (createdEvent) {
        collectionId = +createdEvent.event.data[0];
      }
      if (result.isCompleted) {
        resolve(collectionId);
      }
    }

    // @ts-ignore
    sdk.extrinsics.submit(submitTxArgs, resultCallback);
  });
}
