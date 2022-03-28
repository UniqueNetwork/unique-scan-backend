import { Column, Entity, Index } from 'typeorm';

@Index('nominator_pkey', ['account_id', 'block_height', 'session_index'], {
  unique: true,
})
@Entity('nominator', { schema: 'public' })
export class Nominator {
  @Column('bigint', { primary: true, name: 'block_height' })
  block_height: string;

  @Column('integer', { primary: true, name: 'session_index' })
  session_index: number;

  @Column('text', { primary: true, name: 'account_id' })
  account_id: string;

  @Column('text', { name: 'controller_id' })
  controller_id: string;

  @Column('text', { name: 'stash_id' })
  stash_id: string;

  @Column('integer', { name: 'rank' })
  rank: number;

  @Column('bigint', { name: 'total_staked' })
  total_staked: string;

  @Column('text', { name: 'identity' })
  identity: string;

  @Column('text', { name: 'display_name' })
  display_name: string;

  @Column('text', { name: 'balances' })
  balances: string;

  @Column('bigint', { name: 'available_balance' })
  available_balance: string;

  @Column('bigint', { name: 'free_balance' })
  free_balance: string;

  @Column('bigint', { name: 'locked_balance' })
  locked_balance: string;

  @Column('bigint', { name: 'nonce' })
  nonce: string;

  @Column('text', { name: 'targets' })
  targets: string;

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;
}
