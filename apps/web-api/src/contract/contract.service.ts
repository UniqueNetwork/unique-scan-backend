import { Contract } from '@entities/Contract';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract) private repository: Repository<Contract>,
  ) {}

  async create(contractDto: Contract) {
    return this.repository.create(contractDto);
  }
}
