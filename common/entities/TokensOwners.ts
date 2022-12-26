import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tokens_owners', { schema: 'public' })
export class TokensOwners {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('bigint', { name: 'collection_id' })
  collection_id: number;

  @Column('bigint', { name: 'token_id' })
  token_id: number;

  @Column('bigint', { name: 'amount' })
  amount: number;

  @Column('character varying', { name: 'owner', length: 255 })
  owner: string;

  @Column('text', { name: 'owner_normalized' })
  owner_normalized: string;

  @Column('bigint', { name: 'date_created', nullable: true })
  date_created: string | null;
}
