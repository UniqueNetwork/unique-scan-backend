/* eslint-disable no-console */

import { expectResponseContains } from '../utils';
import { collectionApi } from '../api';
import { createCollection } from '../blockchain/collections';
import { createSdk } from '../blockchain';

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

    const getActualCollection = async () => collectionApi.getById(collectionId);
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

  it('Broken test', async function (done) {
    done(new Error('Test was broken. Error message'));
  });
});
