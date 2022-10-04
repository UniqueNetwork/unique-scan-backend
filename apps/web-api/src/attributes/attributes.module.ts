import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributesResolver } from './attributes.resolver';
import { AttributesService } from './attributes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Collections, Tokens])],
  providers: [AttributesResolver, AttributesService],
})
export class AttributesModule {}
