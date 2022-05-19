import {
  ArgsType,
  Field,
  InputType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';

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
  order_by?: TOrderByParams<T>;
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

export enum IOrderByParams {
  asc = 'ASC',
  desc = 'DESC',
  asc_nulls_first = 'ASC NULLS FIRST',
  asc_nulls_last = 'ASC NULLS LAST',
  desc_nulls_first = 'DESC NULLS FIRST',
  desc_nulls_last = 'DESC NULLS FIRST',
}

export type TOrderByParams<T> = {
  [key in keyof T]: IOrderByParams;
};

registerEnumType(IOrderByParams, {
  name: 'IOrderByParams',
});
