import { Tokens } from '@entities/Tokens';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolderResolver } from './holder.resolver';
import { HolderService } from './holder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tokens])],
  providers: [HolderService, HolderResolver],
})
export class HolderModule {}
