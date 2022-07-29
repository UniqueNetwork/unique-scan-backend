import { Collections } from '@entities/Collections';
import { Event } from '@entities/Event';
import { Extrinsic } from '@entities/Extrinsic';
import { Tokens } from '@entities/Tokens';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionResolver } from './transaction.resolver';
import { TransactionService } from './transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Extrinsic, Collections, Tokens])],
  providers: [TransactionResolver, TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
