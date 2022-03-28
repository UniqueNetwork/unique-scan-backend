import { Collections } from '@entities/Collections';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionResolver } from './collection.resolver';
import { CollectionService } from './collection.service';

@Module({
  imports: [TypeOrmModule.forFeature([Collections])],
  providers: [CollectionResolver, CollectionService],
})
export class CollectionModule {}
