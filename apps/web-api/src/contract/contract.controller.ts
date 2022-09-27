import { Contract } from '@entities/Contract';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { Response } from 'express';

@Controller('contract')
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Get(':id')
  get(@Param('id') id: string): object {
    return { id };
  }

  @Post()
  async create(@Body() createContractDto: Contract, @Res() res: Response) {
    try {
      await this.contractService.create(createContractDto);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
    }

    res.sendStatus(HttpStatus.CREATED);
  }
}
