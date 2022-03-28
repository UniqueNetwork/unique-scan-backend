import { Column, Entity, Index } from 'typeorm';

@Index('chain_pkey', ['block_height'], { unique: true })
@Entity('chain', { schema: 'public' })
export class Chain {
  @Column('bigint', { primary: true, name: 'block_height' })
  block_height: string;

  @Column('integer', { name: 'session_index' })
  session_index: number;

  @Column('text', { name: 'total_issuance' })
  total_issuance: string;

  @Column('bigint', { name: 'active_accounts' })
  active_accounts: string;

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;
}
