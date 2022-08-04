/* eslint-disable no-console */

import { expectResponseContains } from '../utils';
import { collectionsApi } from '../api';
import { createSdk, createCollection } from '../blockchain';

describe('Collections tests', function () {
  it('Create collection in blockchain and check it in scan', async function () {
    const sdk = await createSdk('//Eve');
    const collectionId = await createCollection(
      sdk,
      '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
      {
        name: 'Collection',
        description: 'The one!',
      },
    );

    const getActualCollection = async () =>
      collectionsApi.getById(collectionId);
    const expectedCollection = {
      collection_id: Number(collectionId),
      name: 'Collection',
      description: 'The one!',
    };

    return await expectResponseContains(
      getActualCollection,
      expectedCollection,
    );
  });
});
