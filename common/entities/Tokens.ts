import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DecodedAttributes } from '@unique-nft/schemas';
import { TokenWithInfoV2 } from '@unique-nft/substrate-client/tokens';
import { Attribute } from './Attribute';

export enum TokenType {
  NFT = 'NFT',
  RFT = 'RFT',
  FRACTIONAL = 'FRACTIONAL',
}

export interface ITokenEntities {
  collection_id: number;
  token_id: number;
}

@Index('tokens_pkey', ['token_id', 'collection_id'], { unique: true })
@Index('tokens_collection_id_token_id_owner_idx', [
  'collection_id',
  'token_id',
  'owner',
])
@Index('tokens_owner_normalized_idx', ['owner_normalized'])
@Index('tokens_parent_id_idx', ['parent_id'])
@Entity('tokens', { schema: 'public' })
export class Tokens {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @Column('integer', { name: 'token_id' })
  token_id: number;

  @Column('character varying', { name: 'owner', length: 255 })
  owner: string;

  @Column('jsonb', { name: 'properties', default: [] })
  properties: Array<{ key: string; value: string; valueHex: string }>;

  @Column('jsonb', { name: 'attributes_v1', nullable: true, default: null })
  attributes_v1: DecodedAttributes | null;

  @Column('text', { name: 'image', nullable: true })
  image: string | null;

  @Column('jsonb', { name: 'image_v1', nullable: true, default: null })
  image_v1: {
    fullUrl?: string;
    url?: string;
    ipfsCid?: string;
    urlInfix?: string;
  } | null;

  @Column('bigint', { name: 'collection_id' })
  collection_id: number;

  @Column('bigint', { name: 'date_of_creation', nullable: true })
  date_of_creation?: number;

  @Column('text', { name: 'created_at_block_hash', nullable: true })
  created_at_block_hash?: string;

  @Column('bigint', { name: 'created_at_block_number', nullable: true })
  created_at_block_number?: number;

  @Column('text', { name: 'updated_at_block_hash', nullable: true })
  updated_at_block_hash?: string;

  @Column('bigint', { name: 'updated_at_block_number', nullable: true })
  updated_at_block_number?: number;

  @Column('text', { name: 'owner_normalized' })
  owner_normalized: string;

  @Column('text', { name: 'parent_id', nullable: true })
  parent_id: string;

  @Column('boolean', { name: 'is_sold', default: false })
  is_sold: boolean;

  @Column('text', { name: 'token_name', nullable: true })
  token_name: string;

  @Column({
    type: 'enum',
    enum: TokenType,
    default: TokenType.NFT,
  })
  type: TokenType;

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'[]'",
    nullable: false,
  })
  public children?: ITokenEntities[];

  @Column('boolean', { name: 'burned', default: false })
  burned: boolean;

  @Column('bigint', { name: 'bundle_created', nullable: true })
  bundle_created?: number;

  @Column('bigint', { name: 'total_pieces' })
  total_pieces: number;

  @Column('boolean', { name: 'nested', default: false })
  nested: boolean;

  @Column('jsonb', { name: 'schema_v2', default: null })
  schema_v2: TokenWithInfoV2 | null;

  @Column('text', { name: 'name', nullable: true })
  name?: string;

  @Column('text', { name: 'description', nullable: true })
  description?: string;

  @Column('jsonb', { name: 'image_details', nullable: true })
  image_details?: object;

  @Column('jsonb', { name: 'attributes', nullable: true })
  attributes?: object[];

  @Column('jsonb', { name: 'media', nullable: true, default: null })
  media?: object;

  @Column('jsonb', { name: 'royalties', nullable: true, default: null })
  royalties?: object[];

  @Column('jsonb', { name: 'customizing', nullable: true, default: null })
  customizing?: object;

  @Column('jsonb', {
    name: 'customizing_overrides',
    nullable: true,
    default: null,
  })
  customizing_overrides?: object;

  @Column('text', { name: 'animation_url', nullable: true })
  animation_url?: string;

  @Column('jsonb', { name: 'animation_details', nullable: true, default: null })
  animation_details?: object;

  @Column('text', { name: 'youtube_url', nullable: true })
  youtube_url?: string;

  @Column('text', { name: 'created_by', nullable: true })
  created_by?: string;

  @Column('text', { name: 'background_color', nullable: true })
  background_color?: string;

  @Column('text', { name: 'external_url', nullable: true })
  external_url?: string;

  @Column('text', { name: 'locale', nullable: true })
  locale?: string;
}
