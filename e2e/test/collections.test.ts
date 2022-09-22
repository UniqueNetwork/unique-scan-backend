/* eslint-disable no-console */

import { expectResponseContains } from '../utils';
import { collectionsApi } from '../api';
import { createCollection, createSdk } from '../sdk';
import { getAccount } from '../utils/accounts';
import { defaultCollectionRequest } from '../sdk/collections';

describe('Collections tests', function () {
  it('Create collection in blockchain and check it in scan', async function () {
    const account = await getAccount('//Alice');
    const sdk = await createSdk(account);
    const collectionId = await createCollection(
      sdk,
      account.instance.address,
      defaultCollectionRequest(
        account.instance.address,
        'Collection',
        'The one!',
      ),
      true,
    );

    const getActualCollection = async () =>
      collectionsApi.getById(collectionId);
    const expectedCollection = {
      collection_id: Number(collectionId),
      name: 'Collection',
      description: 'The one!',
    };

    console.log(`collectionId: ${collectionId}`);

    return await expectResponseContains(
      getActualCollection,
      expectedCollection,
    );
  });
});
