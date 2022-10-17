/* eslint-disable no-console */

import { expectResponseContains } from '../utils';
import { createSdk, createCollection, createToken } from '../blockchain';
import { tokensApi } from '../api';

describe('Tokens tests', function () {
  it('Create collection and token ', async function () {
    const sdk = await createSdk('//Eve');
    const collectionId = await createCollection(
      sdk,
      '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
      {
        name: 'Collection',
        description: 'The one!',
      },
    );

    const tokenId = await createToken(
      sdk,
      '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
      collectionId,
    );

    const expectedToken = {
      data: {
        text_required: 'required text',
        text_optional: 'optional text',
      },
    };

    const getActualToken = async () => tokensApi.getById(tokenId, collectionId);

    return await expectResponseContains(getActualToken, expectedToken);
  });
});
