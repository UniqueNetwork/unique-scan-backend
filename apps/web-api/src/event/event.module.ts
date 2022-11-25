import { Event } from '@entities/Event';
import { Tokens } from '@entities/Tokens';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionEventResolver } from './collection-event.resolver';
import { CollectionEventService } from './collection-event.service';
import { EventResolver } from './event.resolver';
import { EventService } from './event.service';
import { TokenEventResolver } from './token-event.resolver';
import { TokenEventService } from './token-event.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Tokens])],
  providers: [
    EventResolver,
    EventService,
    TokenEventResolver,
    TokenEventService,
    CollectionEventResolver,
    CollectionEventService,
  ],
})
export class EventModule {}
