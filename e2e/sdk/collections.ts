import { Sdk } from '@unique-nft/substrate-client';
import { expect } from 'chai';
import { CollectionProperty } from '@unique-nft/substrate-client/tokens';

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

export async function setCollectionProperties(
  sdk: Sdk,
  address: string,
  collectionId: number,
  properties: CollectionProperty[],
) {
  await sdk.collections.setProperties.submitWaitResult({
    address,
    collectionId,
    properties,
  });
}

export const defaultProperties = (
  attributesSchemaType = 'string',
  attributesSchemaName = 'уйцуйцу',
  attributesSchemaOptional = true,
  attributesSchemaIsArray = false,
  attributesSchemaVersion = '1.0.0',
  coverPictureIpfsCid = 'QmU5MKk24zrm26FrWPiQRQJi2xBEiediBLTZLMBoPgaXaX',
  imageUrlTemplate = 'https://ipfs.uniquenetwork.dev/ipfs/{infix}',
  schemaName = 'unique',
  schemaVersion = '1.0.0',
): CollectionProperty[] => [
  {
    key: 'attributesSchema.0',
    value:
      // eslint-disable-next-line max-len
      '{type: attributesSchemaType,name: {_: attributesSchemaName},optional: attributesSchemaOptional,isArray: attributesSchemaIsArray,}',
  },
  {
    key: 'attributesSchemaVersion',
    value: attributesSchemaVersion,
  },
  {
    key: 'coverPicture.ipfsCid',
    value: coverPictureIpfsCid,
  },
  {
    key: 'image.urlTemplate',
    value: imageUrlTemplate,
  },
  {
    key: 'schemaName',
    value: schemaName,
  },
  {
    key: 'schemaVersion',
    value: schemaVersion,
  },
];
