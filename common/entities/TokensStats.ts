import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('tokens_stats_pkey', ['collection_id', 'token_id'], { unique: true })
@Entity('tokens_stats', { schema: 'public' })
export class TokensStats {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @Column('bigint', { name: 'token_id' })
  token_id: number;

  @Column('bigint', { name: 'collection_id' })
  collection_id: number;

  @Column('bigint', { name: 'transfers_count' })
  transfers_count: number;
}
