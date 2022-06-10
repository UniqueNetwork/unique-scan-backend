/* eslint-disable no-console */

import { expect } from 'chai';
import { expectResponseContains } from '../utils';
import { collectionApi } from '../api';
import { createCollection } from '../scripts/create-test-collections.js';
import { collections } from '../data/collections.js';

describe('Collections', function () {
  it('are returned after being created in the blockchain', async function () {
    const schema = collections[0].schema;
    schema.name = 'Collection';
    schema.description = 'The one!';
    schema.tokenPrefix = 'THE1';

    const collection = await createCollection('//Eve', schema);
    const collectionId = collection.collectionId;
    const getActualCollection = async () => collectionApi.getById(collectionId);

    const expectedCollection = {
      collection_id: Number(collectionId),
      name: 'Collection',
      description: 'The one!',
    };

    return expectResponseContains(getActualCollection, expectedCollection);
  });

  it('This test should be green in Gitlab, remove it', async function () {
    const schema = collections[0].schema;
    schema.name = 'Collection';
    schema.description = 'Description';
    schema.tokenPrefix = 'Prefix';

    const collection = await createCollection('//Bob', schema);

    expect(Number(collection.collectionId)).to.be.above(0);
  });
});
