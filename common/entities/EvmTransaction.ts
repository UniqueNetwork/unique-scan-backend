import { Column, Entity, Index } from 'typeorm';

@Index('evm_transaction_pkey', ['transaction_hash'], {
  unique: true,
})
@Entity('evm_transaction', { schema: 'public' })
export class EvmTransaction {
  @Column('text', { name: 'to' })
  to: string;

  @Column('text', { name: 'from' })
  from: string;

  @Column('text', { name: 'contract_address', nullable: true })
  contract_address: string | null;

  @Column('integer', { name: 'transaction_index' })
  transaction_index: number;

  @Column('bigint', { name: 'gas_used' })
  gas_used: number;

  @Column('text', { name: 'logs_bloom' })
  logs_bloom: string;

  @Column('text', { primary: true, name: 'block_hash' })
  block_hash: string;

  @Column('text', { primary: true, name: 'transaction_hash' })
  transaction_hash: string;

  @Column('integer', { name: 'block_number' })
  block_number: number;

  @Column('integer', { name: 'confirmations' })
  confirmations: number;

  @Column('bigint', { name: 'cumulative_gas_used' })
  cumulative_gas_used: number;

  @Column('bigint', { name: 'effective_gas_price' })
  effective_gas_price: number;

  @Column('integer', { name: 'status' })
  status: number;

  @Column('integer', { name: 'type' })
  type: number;

  @Column('boolean', { name: 'byzantium' })
  byzantium: boolean;
}
