import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Collections } from './Collections';

@Index('tokens_pkey', ['id'], { unique: true })
@Entity('tokens', { schema: 'public' })
export class Tokens {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @Column('integer', { name: 'token_id' })
  token_id: number;

  @Column('character varying', { name: 'owner', length: 255 })
  owner: string;

  @Column('jsonb', { name: 'data', default: {} })
  data: object;

  @Column('bigint', { name: 'collection_id' })
  collection_id: number;

  @ManyToOne(() => Collections, (collections) => collections.tokens)
  @JoinColumn([
    { name: 'collection_id', referencedColumnName: 'collection_id' },
  ])
  collection: Collections;

  @Column('bigint', { name: 'date_of_creation', nullable: true })
  date_of_creation?: number;
}
