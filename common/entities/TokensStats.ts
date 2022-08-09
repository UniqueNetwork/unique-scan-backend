import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tokens } from './Tokens';

@Index('tokens_stats_pkey', ['token_id', 'collection_id'], { unique: true })
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

  @OneToOne(() => Tokens, (token) => token.statistics, {
    nullable: true,
  })
  @JoinColumn([
    { name: 'token_id', referencedColumnName: 'token_id' },
    {
      name: 'collection_id',
      referencedColumnName: 'collection_id',
    },
  ])
  token: Tokens;
}
