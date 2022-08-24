import { SubscriberName } from '@common/constants';

export type SubscribersConfig = { [key in SubscriberName]: boolean };

export function createSubscribersConfig(
  env: Record<string, string>,
): SubscribersConfig {
  return {
    [SubscriberName.ACCOUNTS]: env.ACCOUNTS_SUBSCRIBER_DISABLE !== 'true',
    [SubscriberName.BLOCKS]: env.BLOCKS_SUBSCRIBER_DISABLE !== 'true',
    [SubscriberName.COLLECTIONS]: env.COLLECTIONS_SUBSCRIBER_DISABLE !== 'true',
    [SubscriberName.TOKENS]: env.TOKENS_SUBSCRIBER_DISABLE !== 'true',
  };
}
