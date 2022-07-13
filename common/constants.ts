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
}

export enum SchemaVersion {
  IMAGE_URL = 'ImageUrl',
  UNIQUE = 'Unique',
}

export const ETHEREUM_ADDRESS_MAX_LENGTH = 42;

export const NESTING_ADDRESS_PREFIX = '0xf8238ccfff8ed887463fd5e0';
export const NESTING_ADDRESS_COLLECTION_ID_LENGTH = 8;
export const NESTING_ADDRESS_TOKEN_ID_LENGTH = 8;
