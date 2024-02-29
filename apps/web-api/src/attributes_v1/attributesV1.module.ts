import { Module } from '@nestjs/common';
import { AttributesV1Resolver } from './attributesV1.resolver';
import { AttributesV1Service } from './attributesV1.service';

@Module({
  providers: [AttributesV1Resolver, AttributesV1Service],
})
export class AttributesV1Module {}
