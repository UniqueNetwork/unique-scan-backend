export enum EventSection {
  BALANCES = 'Balances',
  COMMON = 'Common',
  SYSTEM = 'System',
  TREASURY = 'Treasury',
  UNIQUE = 'Unique',
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

  COLLECTION_OWNER_CHANGED = 'CollectionOwnedChanged',
  COLLECTION_PERMISSION_CHANGED = 'CollectionPermissionSet',
  COLLECTION_PROPERTY_SET = 'CollectionPropertySet',
  COLLECTION_PROPERTY_DELETED = 'CollectionPropertyDeleted',
  DEPOSIT = 'Deposit',
  ENDOWED = 'Endowed',
  ITEM_CREATED = 'ItemCreated',
  ITEM_DESTROYED = 'ItemDestroyed',
  NEW_ACCOUNT = 'NewAccount',
  EXTRINSIC_SUCCESS = 'ExtrinsicSuccess',
  EXTRINSIC_FAILED = 'ExtrinsicFailed',
  COLLECTION_CREATED = 'CollectionCreated',
  COLLECTION_DESTROYED = 'CollectionDestroyed',
  COLLECTION_LIMIT_SET = 'CollectionLimitSet',
  PROPERTY_PERMISSION_SET = 'PropertyPermissionSet',
  TOKEN_PERMISSION_SET = 'TokenPropertySet',
  TOKEN_PERMISSION_DELETED = 'TokenPropertyDeleted',
  TRANSFER = 'Transfer',
  WITHDRAW = 'Withdraw',
  APPROVED = 'Approved',
  BALANCE_SET = 'BalanceSet',
  RESERVED = 'Reserved',
  UNRESERVED = 'Unreserved',
}

export const EventName = {
  // System
  EXTRINSIC_SUCCESS: `${EventSection.SYSTEM}.${EventMethod.EXTRINSIC_SUCCESS}`,
  EXTRINSIC_FAILED: `${EventSection.SYSTEM}.${EventMethod.EXTRINSIC_FAILED}`,
  NEW_ACCOUNT: `${EventSection.SYSTEM}.${EventMethod.NEW_ACCOUNT}`,

  // Common
  COLLECTION_CREATED: `${EventSection.COMMON}.${EventMethod.COLLECTION_CREATED}`,
  COLLECTION_DESTROYED: `${EventSection.COMMON}.${EventMethod.COLLECTION_DESTROYED}`,
  ITEM_CREATED: `${EventSection.COMMON}.${EventMethod.ITEM_CREATED}`,
  ITEM_DESTROYED: `${EventSection.COMMON}.${EventMethod.ITEM_DESTROYED}`,
  COLLECTION_PROPERTY_SET: `${EventSection.COMMON}.${EventMethod.COLLECTION_PROPERTY_SET}`,
  COLLECTION_PROPERTY_DELETED: `${EventSection.COMMON}.${EventMethod.COLLECTION_PROPERTY_DELETED}`,
  PROPERTY_PERMISSION_SET: `${EventSection.COMMON}.${EventMethod.PROPERTY_PERMISSION_SET}`,
  TOKEN_PROPERTY_SET: `${EventSection.COMMON}.${EventMethod.TOKEN_PERMISSION_SET}`,
  TOKEN_PROPERTY_DELETED: `${EventSection.COMMON}.${EventMethod.TOKEN_PERMISSION_DELETED}`,
  TRANSFER: `${EventSection.COMMON}.${EventMethod.TRANSFER}`,
  APPROVED: `${EventSection.COMMON}.${EventMethod.APPROVED}`,

  // Unique
  ALLOW_LIST_ADDRESS_ADDED: `${EventSection.UNIQUE}.${EventMethod.ALLOW_LIST_ADDRESS_ADDDED}`,
  ALLOW_LIST_ADDRESS_REMOVED: `${EventSection.UNIQUE}.${EventMethod.ALLOW_LIST_ADDRESS_REMOVED}`,
  COLLECTION_SPONSOR_REMOVED: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_SPONSOR_REMOVED}`,
  COLLECTION_ADMIN_ADDED: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_ADMIN_ADDED}`,
  COLLECTION_ADMIN_REMOVED: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_ADMIN_REMOVED}`,
  COLLECTION_OWNED_CHANGED: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_OWNER_CHANGED}`,
  COLLECTION_LIMIT_SET: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_LIMIT_SET}`,
  COLLECTION_SPONSOR_SET: `${EventSection.UNIQUE}.${EventMethod.COLLECTION_SPONSOR_SET}`,
  SPONSORSHIP_CONFIRMED: `${EventSection.UNIQUE}.${EventMethod.SPONSORSHIP_CONFIRMED}`,

  // Balances
  BALANCES_DEPOSIT: `${EventSection.BALANCES}.${EventMethod.DEPOSIT}`,
  BALANCES_ENDOWED: `${EventSection.BALANCES}.${EventMethod.ENDOWED}`,
  BALANCES_WITHDRAW: `${EventSection.BALANCES}.${EventMethod.WITHDRAW}`,
  BALANCES_TRANSFER: `${EventSection.BALANCES}.${EventMethod.TRANSFER}`,
  BALANCES_BALANCE_SET: `${EventSection.BALANCES}.${EventMethod.BALANCE_SET}`,
  BALANCES_RESERVED: `${EventSection.BALANCES}.${EventMethod.RESERVED}`,
  BALANCES_UNRESERVED: `${EventSection.BALANCES}.${EventMethod.UNRESERVED}`,

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
