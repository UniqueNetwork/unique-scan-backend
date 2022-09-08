import { EVENT_ARGS_ACCOUNT_KEYS } from '@common/constants';

type AccountKey = typeof EVENT_ARGS_ACCOUNT_KEYS[number];

export type RawEventArgs =
  | null
  | number
  | string
  | object
  | (string | number | object)[];

export type NormalizedEventArgs = {
  collectionId?: number;
  tokenId?: number;
} & { [key in AccountKey]: string | undefined };
