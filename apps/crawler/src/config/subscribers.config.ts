import { SubscriberName } from '@common/constants';

export type SubscribersConfig = { [key in SubscriberName]: boolean };

export function createSubscribersConfig(
  env: Record<string, string>,
): SubscribersConfig {
  const {
    ACCOUNTS_SUBSCRIBER_DISABLE,
    BLOCKS_SUBSCRIBER_DISABLE,
    COLLECTIONS_SUBSCRIBER_DISABLE,
    TOKENS_SUBSCRIBER_DISABLE,
  } = env;

  return {
    [SubscriberName.ACCOUNTS]: ACCOUNTS_SUBSCRIBER_DISABLE !== 'true',
    [SubscriberName.BLOCKS]: BLOCKS_SUBSCRIBER_DISABLE !== 'true',
    [SubscriberName.COLLECTIONS]: COLLECTIONS_SUBSCRIBER_DISABLE !== 'true',
    [SubscriberName.TOKENS]: TOKENS_SUBSCRIBER_DISABLE !== 'true',
  };
}
