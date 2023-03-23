import { Module } from '@nestjs/common';
import { CirculatingSupplyController } from './circulating-supply.controller';
import { CirculatingSupplyService } from './circulating-supply.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Total } from '@entities/Total';
import { SdkModule } from '@common/sdk/sdk.module';
import { CacheProviderModule } from '@common/cache/cache-provider.module';

@Module({
  imports: [TypeOrmModule.forFeature([Total]), SdkModule, CacheProviderModule],
  controllers: [CirculatingSupplyController],
  providers: [CirculatingSupplyService],
  exports: [CirculatingSupplyService],
})
export class CirculatingModule {}
