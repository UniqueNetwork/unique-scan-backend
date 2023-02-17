import {
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';
import { ITokenEntities, TokenType } from '@entities/Tokens';

export interface TokenData {
  tokenDecoded: TokenByIdResult;
  tokenProperties: TokenPropertiesResult;
  isBundle: boolean;
}

export interface TokenOwnerData {
  owner: string;
  owner_normalized?: string;
  collection_id: number;
  token_id: number;
  date_created?: string;
  amount?: number;
  type?: TokenType;
  block_number?: number;

  parent_id?: string;

  children?: ITokenEntities[];
}
