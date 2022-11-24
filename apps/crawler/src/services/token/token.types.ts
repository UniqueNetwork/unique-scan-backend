import {
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';

export interface TokenData {
  tokenDecoded: TokenByIdResult;
  tokenProperties: TokenPropertiesResult;
  isBundle: boolean;
}
