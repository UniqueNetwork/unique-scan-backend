import { Contract } from '@entities/Contract';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contract])],
  providers: [ContractService],
  controllers: [ContractController],
})
export class ContractModule {}
