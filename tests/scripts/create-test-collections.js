/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const { UniqueHelper } = require('../utils/unique');
const { Logger } = require('../utils/unique/logger');
const { collections } = require('../data/collections');
const config = require('../utils/unique/config');

// Works only for quartz >= 921080
const mintCollectionsAndTokens = async () => {
  // eslint-disable-next-line no-undef
  if (process.env.UNIQUE_COLLECTION_IDS) {
    console.log('UNIQUE_COLLECTION_IDS is defined');
    return;
  }

  let uniqueHelper;
  try {
    uniqueHelper = new UniqueHelper(new Logger());
    await uniqueHelper.connect(config.wsEndpoint);
    const eve = uniqueHelper.util.fromSeed('//Eve');

    const mintedCollectionsIds = [];

    for (const collection of collections) {
      const mintedCollection = await uniqueHelper.mintNFTCollection(
        eve,
        collection.schema,
      );
      await mintedCollection.setLimits(eve, {
        sponsorTransferTimeout: 0,
        sponsorApproveTimeout: 0,
      });
      await mintedCollection.setSponsor(eve, eve.address);
      await mintedCollection.confirmSponsorship(eve);
      await mintedCollection.mintMultipleTokens(
        eve,
        collection.tokens.map((tkn) => {
          return {
            owner: { Substrate: eve.address },
            properties: [{ key: '_old_constData', value: tkn }],
          };
        }),
      );
      mintedCollectionsIds.push(mintedCollection.collectionId.toString());
    }

    fs.appendFileSync(
      '.env',
      `\nUNIQUE_COLLECTION_IDS='${mintedCollectionsIds.join(',')}'`,
    );
  } catch (error) {
    console.log(error.message);
  } finally {
    await uniqueHelper.disconnect();
  }
};

export const createCollection = async (
  seed = '//Eve',
  schema = collections[0].schema,
) => {
  let uniqueHelper;
  try {
    uniqueHelper = new UniqueHelper(new Logger());
    await uniqueHelper.connect(config.wsEndpoint);
    const account = uniqueHelper.util.fromSeed(seed);

    const mintedCollection = await uniqueHelper.mintNFTCollection(
      account,
      schema,
    );
    await mintedCollection.setLimits(account, {
      sponsorTransferTimeout: 0,
      sponsorApproveTimeout: 0,
    });
    await mintedCollection.setSponsor(account, account.address);
    await mintedCollection.confirmSponsorship(account);
    return mintedCollection;
  } catch (error) {
    console.log(error.message);
  } finally {
    await uniqueHelper.disconnect();
  }
};

export const addTokensToCollection = async (collection, tokens) => {
  await mintedCollection.mintMultipleTokens(
    account,
    tokens.map((token) => {
      return {
        owner: { Substrate: account.address },
        properties: [{ key: '_old_constData', value: token }],
      };
    }),
  );
};

mintCollectionsAndTokens().catch((err) => console.log(err.message));
