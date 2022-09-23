import { EVENT_ARGS_ACCOUNT_KEYS } from '@common/constants';

type AccountKey = typeof EVENT_ARGS_ACCOUNT_KEYS[number];

export type EventArgs =
  | null
  | number
  | string
  | object
  | (string | number | object)[];

export type EventValues = {
  collectionId?: number;
  tokenId?: number;
  amount?: string;
} & { [key in AccountKey]: string };