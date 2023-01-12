import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensOwners } from '@entities/TokensOwners';
import { TokenOwnersService } from './token-owners.service';
import { TokenOwnersResolver } from './token-owners.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([TokensOwners])],
  providers: [TokenOwnersResolver, TokenOwnersService],
  exports: [TokenOwnersService],
})
export class TokenOwnersModule {}
