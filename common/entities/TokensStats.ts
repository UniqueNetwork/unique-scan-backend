import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { Tokens } from './Tokens';

@Index('tokens_stats_pkey', ['token_id'], { unique: true })
@Entity('tokens_stats', { schema: 'public' })
export class TokensStats {
  @Column('bigint', { primary: true, name: 'token_id' })
  token_id: number;

  @Column('bigint', { name: 'transfers_count' })
  transfers_count: number;

  @OneToOne(() => Tokens, (token) => token.statistics, {
    nullable: true,
  })
  @JoinColumn([{ name: 'token_id', referencedColumnName: 'token_id' }])
  token: Tokens;
}
