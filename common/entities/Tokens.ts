import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum TokenType {
  NFT = 'NFT',
  FRACTIONAL = 'FRACTIONAL',
  NESTED = 'NESTED',
}

export interface ITokenChild {
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
@Entity('tokens', { schema: 'public' })
export class Tokens {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @Column('integer', { name: 'token_id' })
  token_id: number;

  @Column('character varying', { name: 'owner', length: 255 })
  owner: string;

  @Column('jsonb', { name: 'properties', default: [] })
  properties: object;

  @Column('jsonb', { name: 'attributes', nullable: true, default: null })
  attributes: object;

  @Column('jsonb', { name: 'image', nullable: true, default: null })
  image: object;

  @Column('bigint', { name: 'collection_id' })
  collection_id: number;

  @Column('bigint', { name: 'date_of_creation', nullable: true })
  date_of_creation?: number;

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
  public children?: ITokenChild[];
}
