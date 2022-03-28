import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';

export interface IWhereOperators {
  _eq?: number | string;
  _neq?: number | string;
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
}

@InputType()
export class GQLWhereOpsString implements IWhereOperators {
  @Field(() => String, { nullable: true })
  _eq?: string;

  @Field(() => String, { nullable: true })
  _neq?: string;
}

@ArgsType()
export class GQLQueryPaginationArgs {
  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;
}
