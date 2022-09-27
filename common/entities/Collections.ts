import { Column, Entity, Index } from 'typeorm';

@Index('collections_pkey', ['collection_id'], { unique: true })
@Index('collections_owner_normalized_idx', ['owner_normalized'], {})
@Entity('collections', { schema: 'public' })
export class Collections {
  @Column('bigint', { primary: true, name: 'collection_id' })
  collection_id: number;

  @Column('text', { name: 'owner' })
  owner: string;

  @Column('text', { name: 'name', nullable: true })
  name: string | null;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('text', { name: 'offchain_schema', nullable: true })
  offchain_schema: string | null;

  @Column('bigint', { name: 'token_limit' })
  token_limit: number;

  @Column('jsonb', { name: 'properties', default: [] })
  properties: object | null;

  @Column('jsonb', { name: 'permissions', nullable: true })
  permissions: object | null;

  @Column('jsonb', { name: 'token_property_permissions', default: [] })
  token_property_permissions: object;

  @Column('jsonb', { name: 'attributes_schema', default: {} })
  attributes_schema: object | null;

  @Column('jsonb', { name: 'const_chain_schema', nullable: true, default: {} })
  const_chain_schema: object | null;

  @Column('jsonb', {
    name: 'variable_on_chain_schema',
    nullable: true,
    default: {},
  })
  variable_on_chain_schema: object | null;

  @Column('bigint', { name: 'limits_account_ownership', nullable: true })
  limits_account_ownership: number | null;

  @Column('integer', { name: 'limits_sponsore_data_size', nullable: true })
  limits_sponsore_data_size: number | null;

  @Column('integer', { name: 'limits_sponsore_data_rate', nullable: true })
  limits_sponsore_data_rate: number | null;

  @Column('boolean', { name: 'owner_can_transfer', nullable: true })
  owner_can_transfer: boolean | null;

  @Column('boolean', { name: 'owner_can_destroy', nullable: true })
  owner_can_destroy: boolean | null;

  @Column('character varying', {
    name: 'sponsorship',
    nullable: true,
    length: 255,
  })
  sponsorship: string | null;

  @Column('character varying', {
    name: 'schema_version',
    nullable: true,
    length: 255,
  })
  schema_version: string | null;

  @Column('character varying', {
    name: 'token_prefix',
    nullable: true,
    length: 255,
  })
  token_prefix: string | null;

  @Column('character varying', { name: 'mode', nullable: true, length: 255 })
  mode: string | null;

  @Column('boolean', { name: 'mint_mode', nullable: true })
  mint_mode?: boolean;

  @Column('boolean', { name: 'nesting_enabled', default: false })
  nesting_enabled: boolean;

  @Column('bigint', { name: 'date_of_creation', nullable: true })
  date_of_creation?: number;

  @Column('text', { name: 'owner_normalized' })
  owner_normalized: string;

  @Column('character varying', {
    name: 'collection_cover',
    nullable: true,
    length: 255,
  })
  collection_cover: string | null;

  @Column('boolean', { name: 'was_burn', default: false })
  was_burn: boolean;
}
