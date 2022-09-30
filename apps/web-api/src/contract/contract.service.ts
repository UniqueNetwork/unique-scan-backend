import { Contract } from '@entities/Contract';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContractDTO } from './create-contract.dto';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract) private repository: Repository<Contract>,
  ) {}

  async create(createContractDto: CreateContractDTO) {
    return this.repository.insert(createContractDto);
  }
}
