import { Logger } from '@nestjs/common';
import { Client } from '@unique-nft/substrate-client';

const connectedSdkPromises: Map<string, Promise<Client>> = new Map();

const getConnectedSdk = async (chainWsUrl: string): Promise<Client> => {
  const sdk = await Client.create({ chainWsUrl });
  await sdk.connect();
  return sdk;
};

const logger = new Logger('SDK_FACTORY');

export async function sdkFactory(chainWsUrl: string): Promise<Client> {
  if (!connectedSdkPromises.has(chainWsUrl)) {
    logger.log(`Creating new SDK for ${chainWsUrl}`);
    connectedSdkPromises.set(chainWsUrl, getConnectedSdk(chainWsUrl));
  } else {
    logger.log(`Reusing existing SDK for ${chainWsUrl}`);
  }

  return connectedSdkPromises.get(chainWsUrl);
}
