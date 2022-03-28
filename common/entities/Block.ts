import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index } from 'typeorm';

@Index('block_pkey', ['block_number'], { unique: true })
@Entity('block', { schema: 'public' })
@ObjectType()
export class Block {
  @Column('bigint', { primary: true, name: 'block_number' })
  @Field(() => Int, {
    name: 'block_number',
  })
  block_number: number;

  @Column('bigint', { name: 'block_number_finalized' })
  block_number_finalized: string;

  @Column('text', { name: 'block_author', nullable: true })
  block_author: string | null;

  @Column('text', { name: 'block_author_name', nullable: true })
  block_author_name: string | null;

  @Column('text', { name: 'block_hash' })
  @Field(() => String, {
    name: 'block_hash',
  })
  block_hash: string;

  @Column('text', { name: 'parent_hash' })
  parent_hash: string;

  @Column('text', { name: 'extrinsics_root' })
  extrinsics_root: string;

  @Column('text', { name: 'state_root', nullable: true })
  state_root: string | null;

  @Column('bigint', { name: 'current_era', nullable: true })
  current_era: string | null;

  @Column('bigint', { name: 'current_index', nullable: true })
  current_index: string | null;

  @Column('bigint', { name: 'era_length', nullable: true })
  era_length: string | null;

  @Column('bigint', { name: 'era_progress', nullable: true })
  era_progress: string | null;

  @Column('boolean', { name: 'is_epoch', nullable: true })
  is_epoch: boolean | null;

  @Column('boolean', { name: 'is_election' })
  is_election: boolean;

  @Column('bigint', { name: 'session_length', nullable: true })
  session_length: string | null;

  @Column('integer', { name: 'session_per_era', nullable: true })
  session_per_era: number | null;

  @Column('bigint', { name: 'session_progress', nullable: true })
  session_progress: string | null;

  @Column('integer', { name: 'validator_count' })
  validator_count: number;

  @Column('text', { name: 'spec_name' })
  spec_name: string;

  @Column('integer', { name: 'spec_version' })
  spec_version: number;

  @Column('integer', { name: 'total_events' })
  total_events: number;

  @Column('integer', { name: 'num_transfers' })
  num_transfers: number;

  @Column('integer', { name: 'new_accounts' })
  new_accounts: number;

  @Column('text', { name: 'total_issuance' })
  total_issuance: string;

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;
}
