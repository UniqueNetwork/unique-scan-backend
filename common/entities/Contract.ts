import { Column, Entity, Index } from 'typeorm';

@Index('contract_pkey', ['contract_id'], { unique: true })
@Entity('contract', { schema: 'public' })
export class Contract {
  @Column('text', { primary: true, name: 'contract_id' })
  contract_id: string;

  @Column('text', { name: 'abi' })
  abi: string;
}
