import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';

export interface IWhereOperators {
  _eq?: number | string;
  _neq?: number | string;
  _like?: number | string;
  _ilike?: number | string;
}

export type TWhereParams<T> = {
  [key in keyof T]: IWhereOperators;
};
export interface IGQLQueryArgs<T> {
  limit?: number;
  offset?: number;
  where?: TWhereParams<T>;
}

@InputType()
export class GQLWhereOpsInt implements IWhereOperators {
  @Field(() => Int, { nullable: true })
  _eq?: number;

  @Field(() => Int, { nullable: true })
  _neq?: number;

  @Field(() => Int, { nullable: true })
  _like?: number;

  @Field(() => Int, { nullable: true })
  _ilike?: number;
}

@InputType()
export class GQLWhereOpsString implements IWhereOperators {
  @Field(() => String, { nullable: true })
  _eq?: string;

  @Field(() => String, { nullable: true })
  _neq?: string;

  @Field(() => String, { nullable: true })
  _like?: string;

  @Field(() => String, { nullable: true })
  _ilike?: string;
}

@ArgsType()
export class GQLQueryPaginationArgs {
  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;
}
