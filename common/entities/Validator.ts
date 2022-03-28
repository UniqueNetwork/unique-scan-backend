import { Column, Entity, Index } from 'typeorm';

@Index('validator_pkey', ['account_id', 'block_height', 'session_index'], {
  unique: true,
})
@Index('validator_account_id_idx', ['account_id'], {})
@Entity('validator', { schema: 'public' })
export class Validator {
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

  @Column('text', { name: 'exposure' })
  exposure: string;

  @Column('text', { name: 'exposure_total' })
  exposure_total: string;

  @Column('text', { name: 'exposure_own' })
  exposure_own: string;

  @Column('text', { name: 'exposure_others' })
  exposure_others: string;

  @Column('text', { name: 'nominators' })
  nominators: string;

  @Column('text', { name: 'reward_destination' })
  reward_destination: string;

  @Column('text', { name: 'staking_ledger' })
  staking_ledger: string;

  @Column('text', { name: 'validator_prefs' })
  validator_prefs: string;

  @Column('text', { name: 'commission' })
  commission: string;

  @Column('text', { name: 'session_ids' })
  session_ids: string;

  @Column('text', { name: 'next_session_ids' })
  next_session_ids: string;

  @Column('text', { name: 'session_id_hex' })
  session_id_hex: string;

  @Column('text', { name: 'next_session_id_hex' })
  next_session_id_hex: string;

  @Column('text', { name: 'redeemable' })
  redeemable: string;

  @Column('boolean', { name: 'next_elected' })
  next_elected: boolean;

  @Column('integer', { name: 'produced_blocks' })
  produced_blocks: number;

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;
}
