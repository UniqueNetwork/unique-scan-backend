import { Column, Entity, Index } from 'typeorm';

@Index('system_pkey', ['block_height'], { unique: true })
@Entity('system', { schema: 'public' })
export class System {
  @Column('bigint', { primary: true, name: 'block_height' })
  block_height: string;

  @Column('text', { name: 'chain' })
  chain: string;

  @Column('text', { name: 'node_name' })
  node_name: string;

  @Column('text', { name: 'node_version' })
  node_version: string;

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;
}
