import { Collections } from '@entities/Collections';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SdkService } from '../sdk.service';
import { CollectionsProcessor } from './collections-processor';

@Module({
  imports: [TypeOrmModule.forFeature([Collections])],
  providers: [SdkService, CollectionsProcessor],
  exports: [CollectionsProcessor],
})
export class ProcessorsModule {}
