export enum EventModeCollection {
  NFT = 1,
  Fungible = 2,
  ReFungible = 3,
}

export enum EventSection {
  BALANCES = 'Balances',
  COMMON = 'Common',
  SYSTEM = 'System',
  TREASURY = 'Treasury',
  UNIQUE = 'Unique',
  ETHEREUM = 'Ethereum',
}

export enum EventMethod {
  // Unique
  ALLOW_LIST_ADDRESS_ADDDED = 'AllowListAddressAdded',
  ALLOW_LIST_ADDRESS_REMOVED = 'AllowListAddressRemoved',
  COLLECTION_ADMIN_ADDED = 'CollectionAdminAdded',
  COLLECTION_ADMIN_REMOVED = 'CollectionAdminRemoved',
  COLLECTION_SPONSOR_SET = 'CollectionSponsorSet',
  COLLECTION_SPONSOR_REMOVED = 'CollectionSponsorRemoved',
  SPONSORSHIP_CONFIRMED = 'SponsorshipConfirmed',
  OLD_COLLECTION_OWNER_CHANGED = 'CollectionOwnedChanged',
  COLLECTION_OWNER_CHANGED = 'CollectionOwnerChanged',
  COLLECTION_PERMISSION_SET = 'CollectionPermissionSet',

  // Common
  APPROVED = 'Approved',
  COLLECTION_CREATED = 'CollectionCreated',
  COLLECTION_DESTROYED = 'CollectionDestroyed',
  COLLECTION_PROPERTY_DELETED = 'CollectionPropertyDeleted',
  COLLECTION_PROPERTY_SET = 'CollectionPropertySet',
  ITEM_CREATED = 'ItemCreated',
  ITEM_DESTROYED = 'ItemDestroyed',
  PROPERTY_PERMISSION_SET = 'PropertyPermissionSet',
  TOKEN_PROPERTY_DELETED = 'TokenPropertyDeleted',
  TOKEN_PROPERTY_SET = 'TokenPropertySet',
  // and Transfer

  NEW_ACCOUNT = 'NewAccount',
  EXTRINSIC_SUCCESS = 'ExtrinsicSuccess',
  EXTRINSIC_FAILED = 'ExtrinsicFailed',
  COLLECTION_LIMIT_SET = 'CollectionLimitSet',

  // Balances
  BALANCE_SET = 'BalanceSet',
  DEPOSIT = 'Deposit',
  DUST_LOST = 'DustLost',
  ENDOWED = 'Endowed',
  RESERVED = 'Reserved',
  RESERVED_REPATRIATED = 'ReserveRepatriated',
  SLASHED = 'Slashed',
  TRANSFER = 'Transfer',
  UNRESERVED = 'Unreserved',
  WITHDRAW = 'Withdraw',

  EXECUTED = 'Executed',
}

export const EventName = {
  // System
  EXTRINSIC_SUCCESS: `${EventSection.SYSTEM}.${EventMethod.EXTRINSIC_SUCCESS}`,
  EXTRINSIC_FAILED: `${EventSection.SYSTEM}.${EventMethod.EXTRINSIC_FAILED}`,
  NEW_ACCOUNT: `${EventSection.SYSTEM}.${EventMethod.NEW_ACCOUNT}`,

  // Common
  APPROVED: `${EventSection.COMMON}.${EventMethod.APPROVED}`,
  COLLECTION_CREATED: `${EventSection.COMMON}.${EventMethod.COLLECTION_CREATED}`,
  COLLECTION_DESTROYED: `${EventSection.COMMON}.${EventMethod.COLLECTION_DESTROYED}`,
  COLLECTION_PROPERTY_DELETED: `${EventSection.COMMON}.${EventMethod.COLLECTION_PROPERTY_DELETED}`,
  COLLECTION_PROPERTY_SET: `${EventSection.COMMON}.${EventMethod.COLLECTION_PROPERTY_SET}`,
  ITEM_CREATED: `${EventSection.COMMON}.${EventMethod.ITEM_CREATED}`,
  ITEM_DESTROYED: `${EventSection.COMMON}.${EventMethod.ITEM_DESTROYED}`,
  PROPERTY_PERMISSION_SET: `${EventSection.COMMON}.${EventMethod.PROPERTY_PERMISSION_SET}`,
  TOKEN_PROPERTY_SET: `${EventSection.COMMON}.${EventMethod.TOKEN_PROPERTY_SET}`,
  TOKEN_PROPERTY_DELETED: `${EventSection.COMMON}.${EventMethod.TOKEN_PROPERTY_DELETED}`,
  TRANSFER: `${EventSection.COMMON}.${EventMethod.TRANSFER}`,

  ALLOW_LIST_ADDRESS_ADDED: `${EventSection.COMMON}.${EventMethod.ALLOW_LIST_ADDRESS_ADDDED}`,
  ALLOW_LIST_ADDRESS_REMOVED: `${EventSection.COMMON}.${EventMethod.ALLOW_LIST_ADDRESS_REMOVED}`,
  COLLECTION_SPONSOR_REMOVED: `${EventSection.COMMON}.${EventMethod.COLLECTION_SPONSOR_REMOVED}`,
  COLLECTION_ADMIN_ADDED: `${EventSection.COMMON}.${EventMethod.COLLECTION_ADMIN_ADDED}`,
  COLLECTION_ADMIN_REMOVED: `${EventSection.COMMON}.${EventMethod.COLLECTION_ADMIN_REMOVED}`,
  COLLECTION_OWNED_CHANGED: `${EventSection.COMMON}.${EventMethod.COLLECTION_OWNER_CHANGED}`,
  COLLECTION_LIMIT_SET: `${EventSection.COMMON}.${EventMethod.COLLECTION_LIMIT_SET}`,
  COLLECTION_SPONSOR_SET: `${EventSection.COMMON}.${EventMethod.COLLECTION_SPONSOR_SET}`,
  SPONSORSHIP_CONFIRMED: `${EventSection.COMMON}.${EventMethod.SPONSORSHIP_CONFIRMED}`,
  COLLECTION_PERMISSION_SET: `${EventSection.COMMON}.${EventMethod.COLLECTION_PERMISSION_SET}`,

  // Unique
  OLD_ALLOW_LIST_ADDRESS_ADDED: `${EventSection.UNIQUE}.${EventMethod.ALLOW_LIST_ADDRESS_ADDDED}`,
  OLD_ALLOW_LIST_ADDRESS_REMOVED: `${EventSection.UNIQUE}.${EventMethod.ALLOW_LIST_ADDRESS_REMOVED}`,
  OLD_COLLECTION_SPONSOR_REMOVED: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_SPONSOR_REMOVED}`,
  OLD_COLLECTION_ADMIN_ADDED: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_ADMIN_ADDED}`,
  OLD_COLLECTION_ADMIN_REMOVED: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_ADMIN_REMOVED}`,
  OLD_COLLECTION_OWNED_CHANGED: `${EventSection.UNIQUE}.${EventMethod.OLD_COLLECTION_OWNER_CHANGED}`,
  OLD_COLLECTION_LIMIT_SET: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_LIMIT_SET}`,
  OLD_COLLECTION_SPONSOR_SET: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_SPONSOR_SET}`,
  OLD_SPONSORSHIP_CONFIRMED: `${EventSection.UNIQUE}.${EventMethod.SPONSORSHIP_CONFIRMED}`,
  OLD_COLLECTION_PERMISSION_SET: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_PERMISSION_SET}`,

  // Balances
  BALANCES_DEPOSIT: `${EventSection.BALANCES}.${EventMethod.DEPOSIT}`,
  BALANCES_ENDOWED: `${EventSection.BALANCES}.${EventMethod.ENDOWED}`,
  BALANCES_WITHDRAW: `${EventSection.BALANCES}.${EventMethod.WITHDRAW}`,
  BALANCES_TRANSFER: `${EventSection.BALANCES}.${EventMethod.TRANSFER}`,
  BALANCES_BALANCE_SET: `${EventSection.BALANCES}.${EventMethod.BALANCE_SET}`,
  BALANCES_RESERVED: `${EventSection.BALANCES}.${EventMethod.RESERVED}`,
  BALANCES_UNRESERVED: `${EventSection.BALANCES}.${EventMethod.UNRESERVED}`,
  BALANCES_DUST_LOST: `${EventSection.BALANCES}.${EventMethod.DUST_LOST}`,
  BALANCES_RESERVED_REPATRIATED: `${EventSection.BALANCES}.${EventMethod.RESERVED_REPATRIATED}`,
  BALANCES_SLASHED: `${EventSection.BALANCES}.${EventMethod.SLASHED}`,

  // Treasury
  TREASURY_DEPOSIT: `${EventSection.TREASURY}.${EventMethod.DEPOSIT}`,
};

export enum ExtrinsicSection {
  UNIQUE = 'Unique',
  PARACHAIN_SYSTEM = 'ParachainSystem',
  TIMESTAMP = 'Timestamp',
}

export enum ExtrinsicMethod {
  TRANSFER = 'transfer',
  TRANSFER_FROM = 'transfer_from',
  TRANSFER_ALL = 'transfer_all',
  TRANSFER_KEEP_ALIVE = 'transfer_keep_alive',
  VESTED_TRANSFER = 'vested_transfer',
  CREATE_COLLECTION_EX = 'create_collection_ex',
}

export const STATE_SCHEMA_NAME_BY_MODE = {
  SCAN: 'scan_status',
  RESCAN: 'rescan_status',
};

export enum SubscriberName {
  ACCOUNTS = 'account',
  BLOCKS = 'blocks',
  COLLECTIONS = 'collections',
  TOKENS = 'tokens',
}

export enum SubscriberAction {
  UPSERT = 'UPSERT',
  DELETE = 'DELETE',
  DELETE_NOT_FOUND = 'DELETE: NOT FOUND',
}

export const EVENT_ARGS_ACCOUNT_KEY_DEFAULT = 'account';
export const EVENT_ARGS_COLLECTION_ID_KEY_DEFAULT = 'collectionId';
export const EVENT_ARGS_TOKEN_ID_KEY_DEFAULT = 'tokenId';
export const EVENT_ARGS_ACCOUNT_KEYS = [
  EVENT_ARGS_ACCOUNT_KEY_DEFAULT,
  'who',
  'from',
  'to',
];
export const EVENT_ARGS_AMOUNT_KEY_DEFAULT = 'amount';
export const EVENT_ARGS_AMOUNT_KEYS = [EVENT_ARGS_AMOUNT_KEY_DEFAULT, 'value'];

export const COLLECTION_UPDATE_EVENTS = [
  EventName.COLLECTION_CREATED,
  EventName.COLLECTION_PROPERTY_SET,
  EventName.COLLECTION_PROPERTY_DELETED,
  EventName.PROPERTY_PERMISSION_SET,
  EventName.COLLECTION_SPONSOR_REMOVED,
  EventName.COLLECTION_OWNED_CHANGED,
  EventName.SPONSORSHIP_CONFIRMED,
  EventName.COLLECTION_LIMIT_SET,
  EventName.COLLECTION_SPONSOR_SET,
  // backward support for 040 update afterwards
  EventName.OLD_COLLECTION_SPONSOR_REMOVED,
  EventName.OLD_COLLECTION_OWNED_CHANGED,
  EventName.OLD_SPONSORSHIP_CONFIRMED,
  EventName.OLD_COLLECTION_LIMIT_SET,
  EventName.OLD_COLLECTION_SPONSOR_SET,
];

export const COLLECTION_BURN_EVENTS = [EventName.COLLECTION_DESTROYED];

export const TOKEN_UPDATE_EVENTS = [
  // Insert
  EventName.ITEM_CREATED,

  // Update
  EventName.TRANSFER,
  EventName.TOKEN_PROPERTY_SET,
  EventName.TOKEN_PROPERTY_DELETED,
];

export const TOKEN_BURN_EVENTS = [EventName.ITEM_DESTROYED];

export enum JOIN_TYPE {
  INNER = 'inner',
  LEFT = 'left',
}
