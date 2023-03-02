import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ITokenEntities } from '@entities/Tokens';

export enum TokenType {
  NFT = 'NFT',
  RFT = 'RFT',
  FRACTIONAL = 'FRACTIONAL',
}

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

  @Column({
    type: 'enum',
    enum: TokenType,
    default: TokenType.NFT,
  })
  type: TokenType;

  @Column('bigint', { name: 'block_number' })
  block_number: number;

  @Column('text', { name: 'parent_id', nullable: true })
  parent_id: string;

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'[]'",
    nullable: false,
  })
  public children?: ITokenEntities[];

  @Column('boolean', { name: 'nested', default: false })
  nested: boolean;
}
