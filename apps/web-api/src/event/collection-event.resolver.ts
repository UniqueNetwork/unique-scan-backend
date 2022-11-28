import { Args, Info, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { IDataListResponse, ListDataType } from '../utils/gql-query-args';
import { CollectionEventDTO } from './collection-event.dto';
import { CollectionEventService } from './collection-event.service';
import { QueryArgs } from './collection-event.types';

@ObjectType()
class CollectionEventDataResponse extends ListDataType(CollectionEventDTO) {}

@Resolver(() => CollectionEventDTO)
export class CollectionEventResolver {
  constructor(private collectionEventService: CollectionEventService) {}

  @Query(() => CollectionEventDataResponse)
  public async collection_events(
    @Args() args: QueryArgs,
    @Info() info,
  ): Promise<IDataListResponse<CollectionEventDTO>> {
    return this.collectionEventService.find(args, info);
  }
}
