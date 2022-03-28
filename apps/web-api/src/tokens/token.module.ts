import { Tokens } from '@entities/Tokens';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenResolver } from './token.resolver';
import { TokenService } from './token.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tokens])],
  providers: [TokenResolver, TokenService],
})
export class TokenModule {}
