import { expect } from 'chai';
import { expectResponseContains } from '../utils';
import { collection } from '../api';

describe('Collections', function () {
  it('are returned after being created in the blockchain', async function () {
    const collectionId: number = await createCollection(
      'Collection',
      'The one!',
      'THE1',
      'NFT',
      '//Alice',
    );

    const getActualCollection = async () => collection.getById(collectionId);

    const expectedCollection = {
      collection_id: Number(collectionId),
      name: 'Collection',
      description: 'The one!',
    };

    return expectResponseContains(getActualCollection, expectedCollection);
  });

  it('This test should be green in Gitlab, remove it', async function () {
    const collectionId = await createCollection(
      'Name',
      'Description',
      'Prefix',
      'NFT',
      '//Bob',
    );

    expect(Number(collectionId)).to.be.above(0);
  });
});
