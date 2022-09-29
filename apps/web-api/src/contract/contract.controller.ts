import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { CreateContractDTO } from './create-contract.dto';

@Controller('contract')
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createContractDto: CreateContractDTO) {
    try {
      await this.contractService.create(createContractDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
