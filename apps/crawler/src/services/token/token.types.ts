import {
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';

export interface TokenData {
  tokenDecoded: TokenByIdResult;
  tokenProperties: TokenPropertiesResult;
  isBundle: boolean;
}

export interface TokenOwnerData {
  owner: string;
  owner_normalized: string;
  collection_id: number;
  token_id: number;
  block_hash: string;
  date_created: string;
  amount: number;
}
