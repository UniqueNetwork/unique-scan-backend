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
import { TokenService } from './token.service';
import { CollectionService } from '../collection/collection.service';
import {
  QueryArgs,
  TokenDataResponse,
  TokenEntity,
} from './token.resolver.types';

@Resolver(() => TokenEntity)
export class TokenResolver {
  constructor(
    private service: TokenService,
    @Inject(forwardRef(() => CollectionService))
    private collectionService: CollectionService,
  ) {}

  @Query(() => TokenDataResponse)
  public tokens(
    @Args() args: QueryArgs,
    @Info() info,
  ): Promise<IDataListResponse<TokenEntity>> {
    return this.service.find(args, info);
  }

  @Query(() => TokenDataResponse)
  public tokenBundles(
    @Args() args: QueryArgs,
    @Info() info,
  ): Promise<IDataListResponse<TokenEntity>> {
    return this.service.findBundles(args, info);
  }

  @Query(() => StatisticDataResponse)
  public async tokenStatistics(
    @Args() args: DateRangeArgs,
  ): Promise<StatisticDataResponse> {
    const data = await this.service.statistic(args);
    return { data };
  }

  @ResolveField()
  async collection(@Parent() { collection_id }: TokenEntity, @Info() info) {
    return this.collectionService.getCollectionById(collection_id, info);
  }
}
