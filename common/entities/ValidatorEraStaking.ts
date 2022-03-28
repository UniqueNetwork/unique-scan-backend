import { Column, Entity, Index } from 'typeorm';

@Index('validator_era_staking_pkey', ['era_index', 'era_points'], {
  unique: true,
})
@Entity('validator_era_staking', { schema: 'public' })
export class ValidatorEraStaking {
  @Column('integer', { primary: true, name: 'era_index' })
  era_index: number;

  @Column('text', { name: 'stash_id', nullable: true })
  stash_id: string | null;

  @Column('text', { name: 'identity' })
  identity: string;

  @Column('text', { name: 'display_name' })
  display_name: string;

  @Column('bigint', { name: 'commission', nullable: true })
  commission: string | null;

  @Column('text', { name: 'era_rewards', nullable: true })
  era_rewards: string | null;

  @Column('integer', { primary: true, name: 'era_points' })
  era_points: number;

  @Column('text', { name: 'stake_info', nullable: true })
  stake_info: string | null;

  @Column('bigint', { name: 'estimated_payout' })
  estimated_payout: string;

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;
}
