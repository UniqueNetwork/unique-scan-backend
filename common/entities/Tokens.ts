import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('tokens_pkey', ['token_id', 'collection_id'], { unique: true })
@Index('tokens_collection_id_token_id_owner_idx', [
  'collection_id',
  'token_id',
  'owner',
])
@Index('tokens_parent_id_idx', ['parent_id'])
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

  @Column('boolean', { name: 'burned', default: false })
  burned: boolean;
}
