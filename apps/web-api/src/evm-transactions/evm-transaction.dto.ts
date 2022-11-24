import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { EvmTransaction } from '@entities/EvmTransaction';

@ObjectType('evmTransaction')
export class EvmTransactionDTO implements Partial<EvmTransaction> {
  @Field()
  to?: string;

  @Field()
  from?: string;

  @Field({ nullable: true })
  contract_address?: string | null;

  @Field(() => Int)
  transaction_index?: number;

  @Field(() => Float)
  gas_used?: number;

  @Field()
  logs_bloom?: string;

  @Field()
  block_hash?: string;

  @Field()
  transaction_hash?: string;

  @Field(() => Int)
  block_number?: number;

  @Field(() => Int)
  confirmations?: number;

  @Field(() => Float)
  cumulative_gas_used?: number;

  @Field(() => Float)
  effective_gas_price?: number;

  @Field(() => Int)
  status?: number;

  @Field(() => Int)
  type?: number;

  @Field(() => Boolean)
  byzantium?: boolean;

  @Field(() => Int, { nullable: true })
  timestamp?: string;
}
