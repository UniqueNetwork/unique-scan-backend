import {
  ArgsType,
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import { TokensOwners } from '@entities/TokensOwners';

export interface IWhereOperators {
  _eq?: number | string | boolean;
  _neq?: number | string | boolean;
  _like?: number | string;
  _ilike?: number | string;
  _in?: number[] | string[];
  _is_null?: boolean;
}

type TWhereOperations<T> = {
  _and?: {
    [key in keyof T]: TWhereOperations<T> & IWhereOperators;
  }[];
  _or?: {
    [key in keyof T]: TWhereOperations<T> & IWhereOperators;
  }[];
};

export type TWhereParams<T> = {
  [key in keyof T]: IWhereOperators;
};

export type TWhere<T> = TWhereParams<T> & TWhereOperations<T>;

export interface IOrderByOperators {
  asc: string;
  desc: string;
  asc_nulls_first: string;
  asc_nulls_last: string;
  desc_nulls_first: string;
  desc_nulls_last: string;
}

export enum GQLOrderByParamsArgs {
  asc = 'asc',
  desc = 'desc',
  asc_nulls_first = 'asc_nulls_first',
  asc_nulls_last = 'asc_nulls_last',
  desc_nulls_first = 'desc_nulls_first',
  desc_nulls_last = 'desc_nulls_last',
}

export type TOrderByParams<T> = {
  [key in keyof T]: GQLOrderByParamsArgs;
};

registerEnumType(GQLOrderByParamsArgs, {
  name: 'GQLOrderByParamsArgs',
});

export interface IGQLPaginationArgs {
  limit?: number;
  offset?: number;
}

export interface IGQLQueryArgs<T> {
  limit?: number;
  offset?: number;
  where?: TWhere<T>;
  order_by?: TOrderByParams<T>;
  distinct_on?: string;
}

@InputType()
export class GQLWhereOpsIntEq implements IWhereOperators {
  @Field(() => Float)
  _eq: number;
}

@InputType()
export class GQLWhereNullOps implements IWhereOperators {
  @Field(() => Boolean, { nullable: true })
  _is_null?: boolean;
}

@InputType()
export class GQLWhereOpsInt extends GQLWhereNullOps implements IWhereOperators {
  @Field(() => Float, { nullable: true })
  _eq?: number;

  @Field(() => Float, { nullable: true })
  _neq?: number;

  @Field(() => Float, { nullable: true })
  _like?: number;

  @Field(() => Float, { nullable: true })
  _ilike?: number;

  @Field(() => [Float], { nullable: true })
  _in?: number[];
}

@InputType()
export class GQLWhereOpsString
  extends GQLWhereNullOps
  implements IWhereOperators
{
  @Field(() => String, { nullable: true })
  _eq?: string;

  @Field(() => String, { nullable: true })
  _neq?: string;

  @Field(() => String, { nullable: true })
  _like?: string;

  @Field(() => String, { nullable: true })
  _ilike?: string;

  @Field(() => [String], { nullable: true })
  _in?: string[];
}

@InputType()
export class GQLWhereOpsBoolean implements IWhereOperators {
  @Field(() => Boolean, { nullable: true })
  _eq?: boolean;

  @Field(() => String, { nullable: true })
  _neq?: boolean;
}

@ArgsType()
export class GQLQueryPaginationArgs {
  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;
}

export interface IDataListResponse<T> {
  data: T[];
  count: number;
  timestamp?: number;
}

export interface IDateRange {
  fromDate?: Date;
  toDate?: Date;
}

export interface IStatsResponse {
  count: number;
  date: Date;
}

export function ListDataType<T>(classRef: Type<T>): Type<IDataListResponse<T>> {
  @ObjectType({ isAbstract: true })
  class ListDataType implements IDataListResponse<T> {
    @Field(() => [classRef], { nullable: true })
    data: T[];

    @Field(() => Int)
    count: number;

    @Field(() => Float)
    timestamp: number;
  }

  return ListDataType as Type<IDataListResponse<T>>;
}

export function ListDataTypeOwner<T>(
  classRef: Type<T>,
): Type<IDataListResponse<T>> {
  @ObjectType({ isAbstract: false })
  class ListDataTypeOwner implements IDataListResponse<T> {
    @Field(() => [classRef], { nullable: true })
    data: T[];

    @Field(() => Int)
    count: number;

    @Field(() => Float)
    timestamp: number;
  }

  return ListDataTypeOwner as Type<IDataListResponse<T>>;
}

@ArgsType()
export class DateRangeArgs {
  @Field(() => Date, { nullable: true })
  fromDate?: Date;

  @Field(() => Date, { nullable: true })
  toDate?: Date;
}

@ObjectType()
class StatisticDataEntity {
  @Field(() => Date, { nullable: true })
  date?: Date;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class StatisticDataResponse {
  @Field(() => [StatisticDataEntity], { nullable: true })
  data?: StatisticDataEntity[];
}
