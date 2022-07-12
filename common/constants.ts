export enum EventName {
  COLLECTION_CREATED = 'common.CollectionCreated',
  COLLECTION_DESTROYED = 'common.CollectionDestroyed',
  ITEM_CREATED = 'common.ItemCreated',
  ITEM_DESTROYED = 'common.ItemDestroyed',
  COLLECTION_PROPERTY_SET = 'common.CollectionPropertySet',
  COLLECTION_PROPERTY_DELETED = 'common.CollectionPropertyDeleted',
  PROPERTY_PERMISSION_SET = 'common.PropertyPermissionSet',
  TOKEN_PROPERTY_SET = 'common.TokenPropertySet',
  TOKEN_PROPERTY_DELETED = 'common.TokenPropertyDeleted',
  TRANSFER = 'common.Transfer',

  ALLOW_LIST_ADDRESS_ADDED = 'unique.AllowListAddressAdded',
  ALLOW_LIST_ADDRESS_REMOVED = 'unique.AllowListAddressRemoved',
  COLLECTION_SPONSOR_REMOVED = 'unique.CollectionSponsorRemoved',
  COLLECTION_ADMIN_ADDED = 'unique.CollectionAdminAdded',
  COLLECTION_ADMIN_REMOVED = 'unique.CollectionAdminRemoved',
  COLLECTION_OWNED_CHANGED = 'unique.CollectionOwnedChanged',
  COLLECTION_LIMIT_SET = 'unique.CollectionLimitSet',
  COLLECTION_SPONSOR_SET = 'unique.CollectionSponsorSet',
  SPONSORSHIP_CONFIRMED = 'unique.SponsorshipConfirmed',

  BALANCES_TRANSFER = 'balances.Transfer',
  BALANCES_BALANCESET = 'balances.BalanceSet',
  BALANCES_DEPOSIT = 'balances.Deposit',
  BALANCES_ENDOWED = 'balances.Endowed',
  BALANCES_WITHDRAW = 'balances.Withdraw',

  TREASURY_SPENDING = 'treasury.Spending',
  TREASURY_ROLLOVER = 'treasury.Rollover',
  TREASURY_BURNT = 'treasury.Burnt',
  TREASURY_DEPOSIT = 'treasury.Deposit',

  SYSTEM_NEW_ACCOUNT = 'system.NewAccount',
  SYSTEM_EXTRINSIC_FAILED = 'system.ExtrinsicFailed',
  SYSTEM_EXTRINSIC_SUCCESS = 'system.ExtrinsicSuccess',
}

export enum ExtrinsicNames {
  TIMESTAMP_SET = 'timestamp.set',

  UNIQUE_SET_TOKEN_PROPERTIES = 'unique.setTokenProperties',
  UNIQUE_BURNI_TEM = 'unique.burnItem',
  UNIQUE_CREATE_ITEM = 'unique.createItem',
  UNIQUE_CONFIRM_SPONSOR_SHIP = 'unique.confirmSponsorship',
  UNIQUE_SET_COLLECTION_LIMITS = 'unique.setCollectionLimits',
  UNIQUE_TRANSFER = 'unique.transfer',
  UNIQUE_SET_COLLECTION_SPONSOR = 'unique.setCollectionSponsor',
  UNIQUE_CREATE_MULTIPLE_ITEM_SEX = 'unique.createMultipleItemsEx',
  UNIQUE_CREATE_COLLECTION_EX = 'unique.createCollectionEx',
  UNIQUE_DESTROY_COLLECTION = 'unique.destroyCollection',
  UNIQUE_TRANSFER_FROM = 'unique.transferFrom',
  UNIQUE_SET_TOKEN_PROPERTY_PERMISSIONS = 'unique.setTokenPropertyPermissions',

  BALANCES_TRANSFER = 'balances.transfer',
  BALANCES_TRANSFER_ALL = 'balances.transferAll',
  BALANCES_TRANSFER_KEEP_ALIVE = 'balances.transferKeepAlive',

  PARACHAIN_SYSTEM_SET_VALIDATION_DATA = 'parachainSystem.setValidationData',

  ETHEREUM_TRANSACT = 'ethereum.transact',

  EVM_CALL = 'evm.call',
  SUDO_SET_KEY = 'sudo.setKey',
  SUDO_SUDO = 'sudo.sudo',
}

export enum SchemaVersion {
  IMAGE_URL = 'ImageUrl',
  UNIQUE = 'Unique',
}

export enum EventMethod {
  TRANSFER = 'Transfer',
  DEPOSIT = 'Deposit',
  WITHDRAW = 'Withdraw',
  ENDOWED = 'Endowed',
  EXTRINSIC_SUCCESS = 'ExtrinsicSuccess',
}

export enum EventSection {
  SYSTEM = 'system',
  BALANCES = 'balances',
  TREASURY = 'treasury',
}

export const ETHEREUM_ADDRESS_MAX_LENGTH = 42;

export enum EventPhase {
  INITIALIZATION = 'Initialization',
}
