import {
  Args,
  ArgsType,
  Field,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { StatisticsV2Dto } from './statisticsV2.dto';
import { StatisticsV2Service } from './statisticsV2.service';

@ObjectType()
class BlockchainTimestampsResponse {
  @Field(() => Number)
  firstBlockTimestamp: number;

  @Field(() => Number)
  lastBlockTimestamp: number;
}

@ObjectType()
class CountResponse {
  @Field(() => Number)
  count: number;
}

@ArgsType()
class StatisticsV2Args {
  @Field(() => Number, { nullable: false })
  from: number;

  @Field(() => Number, { nullable: false })
  to: number;
}

@Resolver(() => StatisticsV2Dto)
export class StatisticsV2Resolver {
  constructor(private service: StatisticsV2Service) {}

  @Query(() => BlockchainTimestampsResponse)
  public async blockchainTimestamps(): Promise<BlockchainTimestampsResponse> {
    return this.service.getBlockchainTimestamps();
  }

  @Query(() => CountResponse)
  public async extrinsicsCount(
    @Args() args: StatisticsV2Args,
  ): Promise<CountResponse> {
    return this.service.getExtrinsicsCount(args);
  }

  @Query(() => CountResponse)
  public async tokenTransferCount(
    @Args() args: StatisticsV2Args,
  ): Promise<CountResponse> {
    return this.service.getTokenTransferCount(args);
  }

  @Query(() => CountResponse)
  public async balanceTransferCount(
    @Args() args: StatisticsV2Args,
  ): Promise<CountResponse> {
    return this.service.getBalanceTransferCount(args);
  }

  @Query(() => CountResponse)
  public async collectionCreatedCount(
    @Args() args: StatisticsV2Args,
  ): Promise<CountResponse> {
    return this.service.getCollectionCreatedCount(args);
  }

  @Query(() => CountResponse)
  public async tokenCreatedCount(
    @Args() args: StatisticsV2Args,
  ): Promise<CountResponse> {
    return this.service.getTokenCreatedCount(args);
  }
}
