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

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;

  @Column('integer', { name: 'total_extrinsics' })
  total_extrinsics: number;
}
