import { Column, Entity, Index } from 'typeorm';

@Index('phragmen_pkey', ['block_height'], { unique: true })
@Entity('phragmen', { schema: 'public' })
export class Phragmen {
  @Column('bigint', { primary: true, name: 'block_height' })
  block_height: string;

  @Column('text', { name: 'phragmen_json' })
  phragmen_json: string;

  @Column('bigint', { name: 'timestamp' })
  timestamp: string;
}
