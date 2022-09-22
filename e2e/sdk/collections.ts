import { Sdk } from '@unique-nft/substrate-client';
import { expect } from 'chai';

export async function createCollection(
  sdk: Sdk,
  address: string,
  args,
  checkResult = false,
): Promise<number> {
  const { collectionId } = (
    await sdk.collections.creation.submitWaitResult(args)
  ).parsed!;
  if (checkResult) {
    expect(collectionId).to.be.a('number');
  }
  return collectionId;
}

export const defaultCollectionRequest = (
  address: string,
  name = 'Sample collection name',
  description = 'sample collection description',
  tokenPrefix = 'TEST',
) => ({
  mode: 'Nft',
  name,
  description,
  tokenPrefix,
  metaUpdatePermission: 'ItemOwner',
  permissions: {
    access: 'Normal',
    mintMode: true,
    nesting: {
      tokenOwner: true,
      collectionAdmin: true,
    },
  },
  readOnly: true,
  address,
});
