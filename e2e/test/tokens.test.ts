/* eslint-disable no-console */

import { expectResponseContains } from '../utils';
import { createCollection, createSdk, createToken } from '../sdk';
import { tokensApi } from '../api';
import { getAccount } from '../utils/accounts';
import { defaultTokenRequest } from '../sdk/tokens';
import { defaultCollectionRequest } from '../sdk/collections';

describe('Tokens tests', function () {
  it('Create collection and token ', async function () {
    const account = await getAccount('//Alice');
    const sdk = await createSdk(account);
    const collectionId = await createCollection(
      sdk,
      account.instance.address,
      defaultCollectionRequest(
        account.instance.address,
        'Collection',
        'The one!',
        'Pref',
      ),
      true,
    );

    const tokenId = await createToken(
      sdk,
      account.instance.address,
      defaultTokenRequest(
        collectionId,
        account.instance.address,
        account.instance.address,
        'Hello',
      ),
    );

    const expectedToken = {
      owner: account.instance.address,
      token_name: `Pref #${tokenId}`,
    };
    console.log(`collectionId: ${collectionId}, tokenId: ${tokenId}`);

    const getActualToken = async () => tokensApi.getById(tokenId, collectionId);
    await expectResponseContains(getActualToken, expectedToken);
  });
});
