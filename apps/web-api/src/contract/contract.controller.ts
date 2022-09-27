import { Contract } from '@entities/Contract';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ContractService } from './contract.service';

@Controller('contract')
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Get()
  get(contactId: string): object {
    return { message: `Contract hello ${contactId}` };
  }

  @Post()
  create(@Body() createContractDto: Contract) {
    this.contractService.create(createContractDto);
  }
}
