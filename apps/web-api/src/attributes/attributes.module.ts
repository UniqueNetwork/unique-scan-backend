import { Module } from '@nestjs/common';
import { AttributesResolver } from './attributes.resolver';
import { AttributesService } from './attributes.service';

@Module({
  providers: [AttributesResolver, AttributesService],
})
export class AttributesModule {}
