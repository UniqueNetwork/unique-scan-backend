import { Column, Entity, Index } from 'typeorm';

@Index('log_pkey', ['block_number', 'log_index'], { unique: true })
@Entity('log', { schema: 'public' })
export class Log {
  @Column('bigint', { primary: true, name: 'block_number' })
  block_number: string;

  @Column('integer', { primary: true, name: 'log_index' })
  log_index: number;

  @Column('text', { name: 'type', nullable: true })
  type: string | null;

  @Column('text', { name: 'engine' })
  engine: string;

  @Column('text', { name: 'data' })
  data: string;
}
