import { Column, Entity, Index } from 'typeorm';

@Index('event_pkey', ['block_number', 'event_index'], { unique: true })
@Index('event_block_index_idx', ['block_index'], {})
@Index('event_method_idx', ['method'], {})
@Index('event_section_method_phase_idx', ['section', 'method', 'phase'], {})
@Entity('event', { schema: 'public' })
export class Event {
  @Column('bigint', { primary: true, name: 'block_number' })
  block_number: string;

  @Column('integer', { primary: true, name: 'event_index' })
  event_index: number;

  @Column('text', { name: 'section' })
  section: string;

  @Column('text', { name: 'method' })
  method: string;

  @Column('text', { name: 'phase' })
  phase: string;

  @Column('text', { name: 'data' })
  data: string;

  @Column('bigint', { name: 'timestamp', nullable: true })
  timestamp: string | null;

  @Column('text', { name: 'amount', nullable: true })
  amount: string | null;

  @Column('text', { name: 'block_index', nullable: true })
  block_index: string;
}
