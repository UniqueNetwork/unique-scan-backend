export interface Settings {
  blockchain: Blockchain;
  auction: Auction;
}

export interface Blockchain {
  escrowAddress: string;
  unique: Unique;
  kusama: Kusama;
}

export interface Unique {
  wsEndpoint: string;
  collectionIds: number[];
  contractAddress: string;
}

export interface Kusama {
  wsEndpoint: string;
  marketCommission: string;
}

export interface Auction {
  commission: number;
  address: string;
}
