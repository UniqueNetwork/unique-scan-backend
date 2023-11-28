import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Total } from '@entities/Total';
import { SdkService } from '@common/sdk/sdk.service';
import { getAmount } from '@common/utils';

@Injectable()
export class CirculatingSupplyService {
  private logger: Logger;
  constructor(
    private sdkService: SdkService,
    @InjectRepository(Total) private repo: Repository<Total>,
  ) {
    this.logger = new Logger(CirculatingSupplyService.name);
  }

  async readCirculatingSupply(): Promise<any> {
    const circulating = await this.repo.findOne({
      where: { name: 'circulating_supply' },
    });
    const staked = await this.sdkService.getTotalStaked();
    const circulatingTotal = BigInt(circulating.count) + BigInt(staked.json);
    const total = await this.sdkService.getTotalSupply();
    const count = BigInt(total.json).toString();
    this.logger.log({ request: 'circulating supply', count, total, staked });
    return {
      circulatingSupply: Number(getAmount(circulatingTotal.toString())),
      totalSupply: Number(getAmount(count)),
    };
  }
}
