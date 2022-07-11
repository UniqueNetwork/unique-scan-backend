import { UtilsService } from './utils.service';
import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [],
  providers: [UtilsService],
  exports: [UtilsService],
})
export class UtilsModule {}
