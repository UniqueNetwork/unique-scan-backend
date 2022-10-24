import {
  CollectionInfoWithSchema,
  TokenByIdResult,
  TokenPropertiesResult,
} from '@unique-nft/substrate-client/tokens';

export interface TokenData {
  tokenDecoded: TokenByIdResult;
  tokenProperties: TokenPropertiesResult;
  collectionDecoded: CollectionInfoWithSchema;
  isBundle: boolean;
}
