import {
  Args,
  ArgsType,
  Field,
  InputType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  GQLQueryPaginationArgs,
  GQLWhereOpsString,
  IGQLQueryArgs,
  TWhereParams,
} from '../utils/gql-query-args';
import { ExtrinsicDTO } from './extrinsic.dto';
import { ExtrinsicService } from './extrinsic.service';

@InputType()
class ExtrinsicWhereParams implements TWhereParams<ExtrinsicDTO> {
  @Field(() => GQLWhereOpsString, { nullable: true })
  block_index?: GQLWhereOpsString;

  @Field(() => GQLWhereOpsString, { nullable: true })
  block_number?: GQLWhereOpsString;
}

@ArgsType()
class QueryArgs
  extends GQLQueryPaginationArgs
  implements IGQLQueryArgs<ExtrinsicDTO>
{
  @Field(() => ExtrinsicWhereParams, { nullable: true })
  where?: ExtrinsicWhereParams;
}

@Resolver(() => ExtrinsicDTO)
export class ExtrinsicResolver {
  constructor(private service: ExtrinsicService) {}

  @Query(() => [ExtrinsicDTO])
  public async extrinsics(@Args() args: QueryArgs): Promise<ExtrinsicDTO[]> {
    return this.service.find(args);
  }
}
