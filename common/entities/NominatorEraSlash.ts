import { Column, Entity, Index } from 'typeorm';

@Index('nominator_era_slash_pkey', ['era_index', 'stash_id'], { unique: true })
@Entity('nominator_era_slash', { schema: 'public' })
export class NominatorEraSlash {
  @Column('integer', { primary: true, name: 'era_index' })
  era_index: number;

  @Column('text', { primary: true, name: 'stash_id' })
  stash_id: string;

  @Column('bigint', { name: 'amount' })
  amount: string;

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;
}
