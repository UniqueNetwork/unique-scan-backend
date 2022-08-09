import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { Collections } from './Collections';

@Index('collections_stats_pkey', ['collection_id'], { unique: true })
@Entity('collections_stats', { schema: 'public' })
export class CollectionsStats {
  @Column('bigint', { primary: true, name: 'collection_id' })
  collection_id: number;

  @Column('bigint', { name: 'tokens_count' })
  tokens_count: number;

  @Column('bigint', { name: 'holders_count' })
  holders_count: number;

  @Column('bigint', { name: 'actions_count' })
  actions_count: number;

  @Column('bigint', { name: 'transfers_count', default: 0 })
  transfers_count: number;

  @OneToOne(() => Collections, (collections) => collections.statistics, {
    nullable: true,
  })
  @JoinColumn([
    { name: 'collection_id', referencedColumnName: 'collection_id' },
  ])
  collection: Collections;
}
