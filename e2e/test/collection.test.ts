/* eslint-disable no-console */

import { expectResponseContains } from '../utils';
import { collectionApi } from '../api';
import { createCollection } from '../blockchain/collections';
import { createSdk } from '../blockchain';

describe('Collections', function () {
  it('are returned after being created in the blockchain', async function () {
    const sdk = await createSdk('//Eve');
    const collectionId = await createCollection(
      sdk,
      '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
      {
        name: 'Collection',
        description: 'The one!',
      },
    );

    console.log(collectionId);
    const getActualCollection = async () => collectionApi.getById(collectionId);

    const expectedCollection = {
      collection_id: Number(collectionId),
      name: 'Collection3',
      description: 'The one!',
    };

    return await expectResponseContains(
      getActualCollection,
      expectedCollection,
    );
  });
});
