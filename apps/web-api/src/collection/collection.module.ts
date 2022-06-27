import { Collections } from '@entities/Collections';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionResolver } from './collection.resolver';
import { CollectionService } from './collection.service';
import { TokenModule } from '../tokens/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collections]),
    forwardRef(() => TokenModule),
  ],
  providers: [CollectionResolver, CollectionService],
  exports: [CollectionService],
})
export class CollectionModule {}
