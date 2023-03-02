import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvmTransaction } from '@entities/EvmTransaction';
import { EvmTransactionResolver } from './evm-transaction.resolver';
import { EvmTransactionService } from './evm-transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([EvmTransaction])],
  providers: [EvmTransactionResolver, EvmTransactionService],
})
export class EvmTransactionModule {}
