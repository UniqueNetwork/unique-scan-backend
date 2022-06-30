import { Sdk } from '@unique-nft/sdk';
import { CreateCollectionArguments } from '@unique-nft/sdk/tokens';
import '@unique-nft/sdk/tokens';
import '@unique-nft/sdk/extrinsics';
import { CollectionFields, CollectionFieldTypes } from '@unique-nft/sdk/types';

export async function createCollection(
  sdk: Sdk,
  address: string,
  {
    name = 'My collection',
    description = 'my test collection',
    tokenPrefix = 'FOO',
  },
): Promise<number> {
  const fields: CollectionFields = [
    {
      id: 1,
      name: 'text_required',
      type: CollectionFieldTypes.TEXT,
      required: true,
    },
    {
      id: 2,
      name: 'text_optional',
      type: CollectionFieldTypes.TEXT,
    },
  ];

  const createArgs: CreateCollectionArguments = {
    address,
    name,
    description,
    tokenPrefix,
    properties: { fields },
  };
  const createResult = await sdk.collections.creation.submitWaitResult(
    createArgs,
  );
  return createResult.parsed.collectionId;
}
