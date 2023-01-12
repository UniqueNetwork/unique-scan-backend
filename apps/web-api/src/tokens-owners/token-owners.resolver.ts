import { Args, Info, Query, Resolver } from '@nestjs/graphql';
import {
  QueryArgsTokenOwner,
  TokenOwnersDataResponse,
} from './token-owners.resolver.types';
import { IDataListResponse } from '../utils/gql-query-args';
import { TokenOwnersService } from './token-owners.service';
import { TokenOwnersDTO } from './token-owners.dto';

@Resolver(() => TokenOwnersDTO)
export class TokenOwnersResolver {
  constructor(private service: TokenOwnersService) {}

  @Query(() => TokenOwnersDataResponse)
  public async token_owners(
    @Args() args: QueryArgsTokenOwner,
    @Info() info,
  ): Promise<IDataListResponse<TokenOwnersDTO>> {
    return this.service.findTokenOwner(args, info);
  }
}
