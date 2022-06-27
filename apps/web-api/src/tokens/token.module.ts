import { Tokens } from '@entities/Tokens';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenResolver } from './token.resolver';
import { TokenService } from './token.service';
import { CollectionModule } from '../collection/collection.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tokens]),
    forwardRef(() => CollectionModule),
  ],
  providers: [TokenResolver, TokenService],
  exports: [TokenService],
})
export class TokenModule {}
