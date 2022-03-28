import { Account } from '@entities/Account';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountResolver } from './account.resolver';
import { AccountService } from './account.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [AccountResolver, AccountService],
})
export class AccountModule {}
