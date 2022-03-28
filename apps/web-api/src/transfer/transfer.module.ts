import { Event } from '@entities/Event';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransferResolver } from './transfer.resolver';
import { TransferService } from './transfer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  providers: [TransferResolver, TransferService],
})
export class TransferModule {}
