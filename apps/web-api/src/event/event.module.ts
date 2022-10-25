import { Event } from '@entities/Event';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventResolver } from './event.resolver';
import { EventService } from './event.service';
import { TokenEventResolver } from './token-event.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  providers: [EventResolver, EventService, TokenEventResolver],
})
export class EventModule {}
