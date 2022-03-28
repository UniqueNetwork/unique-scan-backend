import { Column, Entity, Index } from 'typeorm';

@Index('total_pkey', ['name'], { unique: true })
@Entity('total', { schema: 'public' })
export class Total {
  @Column('text', { primary: true, name: 'name' })
  name: string;

  @Column('bigint', { name: 'count' })
  count: string;
}
