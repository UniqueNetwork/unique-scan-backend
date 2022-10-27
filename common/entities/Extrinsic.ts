import { Column, Entity, Index } from 'typeorm';

@Index('extrinsic_pkey', ['block_number', 'extrinsic_index'], { unique: true })
@Index('extrinsic_block_index_idx', ['block_index'], { unique: true })
@Index('extrinsic_method_idx', ['method'], {})
@Index('extrinsic_section_idx', ['section'], {})
@Index('extrinsic_signer_idx', ['signer'], {})
@Index('extrinsic_timestamp_idx', ['timestamp'], {})
@Index('extrinsic_to_owner_idx', ['to_owner'], {})
@Entity('extrinsic', { schema: 'public' })
export class Extrinsic {
  @Column('bigint', { primary: true, name: 'block_number' })
  block_number: string;

  @Column('integer', { primary: true, name: 'extrinsic_index' })
  extrinsic_index: number;

  @Column('boolean', { name: 'is_signed' })
  is_signed: boolean;

  @Column('text', { name: 'signer', nullable: true })
  signer: string | null;

  @Column('text', { name: 'section' })
  section: string;

  @Column('text', { name: 'method' })
  method: string;

  @Column('text', { name: 'args' })
  args: string;

  @Column('text', { name: 'hash' })
  hash: string;

  @Column('boolean', { name: 'success' })
  success: boolean;

  @Column('bigint', { name: 'timestamp', nullable: true })
  timestamp: string | null;

  @Column('text', { name: 'amount', nullable: true })
  amount: string | null;

  @Column('text', { name: 'fee', nullable: true })
  fee: string | null;

  @Column({ length: 255, nullable: true })
  block_index: string;

  @Column({ length: 255, nullable: true })
  to_owner?: string;

  @Column('text', { name: 'signer_normalized', nullable: true })
  signer_normalized: string | null;

  @Column('text', { name: 'to_owner_normalized', nullable: true })
  to_owner_normalized?: string | null;
}
