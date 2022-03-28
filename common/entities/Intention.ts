import { Column, Entity, Index } from 'typeorm';

@Index('intention_account_id_idx', ['account_id'], {})
@Index('intention_pkey', ['account_id', 'block_height', 'session_index'], {
  unique: true,
})
@Entity('intention', { schema: 'public' })
export class Intention {
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

  @Column('text', { name: 'stakers' })
  stakers: string;

  @Column('text', { name: 'identity' })
  identity: string;

  @Column('text', { name: 'display_name' })
  display_name: string;

  @Column('text', { name: 'nominators' })
  nominators: string;

  @Column('text', { name: 'reward_destination' })
  reward_destination: string;

  @Column('text', { name: 'staking_ledger' })
  staking_ledger: string;

  @Column('text', { name: 'staking_ledger_total' })
  staking_ledger_total: string;

  @Column('text', { name: 'validator_prefs' })
  validator_prefs: string;

  @Column('text', { name: 'commission' })
  commission: string;

  @Column('text', { name: 'next_session_ids' })
  next_session_ids: string;

  @Column('text', { name: 'next_session_id_hex' })
  next_session_id_hex: string;

  @Column('boolean', { name: 'next_elected' })
  next_elected: boolean;

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;
}
