import { Column, Entity, Index } from 'typeorm';

@Index('account_pkey', ['account_id'], { unique: true })
@Index('account_account_id_normalized_idx', ['account_id_normalized'], {})
@Entity('account', { schema: 'public' })
export class Account {
  @Column('text', { primary: true, name: 'account_id' })
  account_id: string;

  @Column('text', { name: 'balances' })
  balances: string;

  @Column('text', { name: 'available_balance', nullable: true })
  available_balance: string | null;

  @Column('text', { name: 'free_balance' })
  free_balance: string;

  @Column('text', { name: 'locked_balance' })
  locked_balance: string;

  @Column('text', { name: 'nonce', nullable: true })
  nonce: string | null;

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;

  @Column('bigint', { name: 'block_height' })
  block_height: string;

  @Column('text', { name: 'account_id_normalized' })
  account_id_normalized: string;
}
