import { Controller, Get } from '@nestjs/common';
import { CirculatingSupplyService } from './circulating-supply.service';

@Controller()
export class CirculatingSupplyController {
  constructor(private circulatingService: CirculatingSupplyService) {}

  @Get('/supply')
  async readCirculatingSupply() {
    return await this.circulatingService.readCirculatingSupply();
  }
}
