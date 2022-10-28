import {
  Args,
  Info,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { forwardRef, Inject } from '@nestjs/common';
import {
  DateRangeArgs,
  IDataListResponse,
  StatisticDataResponse,
} from '../utils/gql-query-args';
import { CollectionDTO } from './collection.dto';
import { CollectionService } from './collection.service';
import { TokenService } from '../tokens/token.service';
import {
  CollectionDataResponse,
  CollectionEntity,
  QueryArgs,
} from './collection.resolver.types';
import { QueryArgs as TokenQueryArgs } from '../tokens/token.resolver.types';

@Resolver(() => CollectionEntity)
export class CollectionResolver {
  constructor(
    private service: CollectionService,
    @Inject(forwardRef(() => TokenService)) private tokenService: TokenService,
  ) {}

  @Query(() => CollectionDataResponse)
  public async collections(
    @Args() args: QueryArgs,
    @Info() info,
  ): Promise<IDataListResponse<CollectionDTO>> {
    return this.service.find(args, info);
  }

  @ResolveField()
  async tokens(
    @Parent() { collection_id }: CollectionEntity,
    @Args({ nullable: true, defaultValue: {} }) args: TokenQueryArgs,
    @Info() info,
  ) {
    return this.tokenService.getByCollectionId(collection_id, args, info);
  }

  @Query(() => StatisticDataResponse)
  public async collectionsStatistics(
    @Args() args: DateRangeArgs,
  ): Promise<StatisticDataResponse> {
    const data = await this.service.statistic(args);
    return { data };
  }
}
