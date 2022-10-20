/* eslint-disable no-console */

import { expectResponseContains } from '../utils';
import { collectionsApi } from '../api';
import { createCollection, createSdk } from '../sdk';
import { getAccount } from '../utils/accounts';
import {
  defaultCollectionRequest,
  defaultProperties,
  setCollectionProperties,
} from '../sdk/collections';

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

    const testProperties = defaultProperties();

    setCollectionProperties(
      sdk,
      account.instance.address,
      collectionId,
      testProperties,
    );

    const getActualCollection = async () =>
      collectionsApi.getById(collectionId);
    const expectedCollection = {
      collection_id: Number(collectionId),
      name: 'Collection',
      description: 'The one!',
      properties: testProperties,
    };

    console.log(`collectionId: ${collectionId}`);

    await expectResponseContains(getActualCollection, expectedCollection);

    console.log(
      'Collection:',
      JSON.stringify(await getActualCollection(), null, 2),
    );
  });
});
