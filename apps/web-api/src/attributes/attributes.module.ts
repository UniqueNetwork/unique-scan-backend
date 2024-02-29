import { Module } from '@nestjs/common';
import { AttributesResolver } from './attributes.resolver';
import { AttributesService } from './attributes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from '@common/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Attribute])],
  providers: [AttributesResolver, AttributesService],
})
export class AttributesModule {}
