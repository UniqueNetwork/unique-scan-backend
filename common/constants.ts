export enum EventName {
  COLLECTION_CREATED = 'Common.CollectionCreated',
  COLLECTION_DESTROYED = 'Common.CollectionDestroyed',
  ITEM_CREATED = 'Common.ItemCreated',
  ITEM_DESTROYED = 'Common.ItemDestroyed',
  COLLECTION_PROPERTY_SET = 'Common.CollectionPropertySet',
  COLLECTION_PROPERTY_DELETED = 'Common.CollectionPropertyDeleted',
  PROPERTY_PERMISSION_SET = 'Common.PropertyPermissionSet',
  TOKEN_PROPERTY_SET = 'Common.TokenPropertySet',
  TOKEN_PROPERTY_DELETED = 'Common.TokenPropertyDeleted',
  TRANSFER = 'Common.Transfer',

  ALLOW_LIST_ADDRESS_ADDED = 'Unique.AllowListAddressAdded',
  ALLOW_LIST_ADDRESS_REMOVED = 'Unique.AllowListAddressRemoved',
  COLLECTION_SPONSOR_REMOVED = 'Unique.CollectionSponsorRemoved',
  COLLECTION_ADMIN_ADDED = 'Unique.CollectionAdminAdded',
  COLLECTION_ADMIN_REMOVED = 'Unique.CollectionAdminRemoved',
  COLLECTION_OWNED_CHANGED = 'Unique.CollectionOwnedChanged',
  COLLECTION_LIMIT_SET = 'Unique.CollectionLimitSet',
  COLLECTION_SPONSOR_SET = 'Unique.CollectionSponsorSet',
  SPONSORSHIP_CONFIRMED = 'Unique.SponsorshipConfirmed',
}

export enum SchemaVersion {
  IMAGE_URL = 'ImageUrl',
  UNIQUE = 'Unique',
}

export const ETHEREUM_ADDRESS_MAX_LENGTH = 42;

export const NESTING_ADDRESS_PREFIX = '0xf8238ccfff8ed887463fd5e0';
export const NESTING_ADDRESS_COLLECTION_ID_LENGTH = 8;
export const NESTING_ADDRESS_TOKEN_ID_LENGTH = 8;
