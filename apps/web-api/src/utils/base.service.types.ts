import { Equal, ILike, Like, Not, In, FindOperator } from 'typeorm';

import { IOrderByOperators, IWhereOperators } from './gql-query-args';

export type TWhereCondition =
  | typeof Equal
  | typeof Not
  | typeof Like
  | typeof ILike
  | typeof In;

type TOperatorsMap = {
  [key in keyof IWhereOperators]: TWhereCondition;
};

export type TWhereValue = (string | FindOperator<string>) &
  (string[] | FindOperator<string>) &
  (number | FindOperator<number>) &
  (number[] | FindOperator<number>);

export const GQLToORMOperatorsMap: TOperatorsMap = {
  _eq: Equal,
  _neq: Not,
  _like: Like,
  _ilike: ILike,
  _in: In,
};

type TOrderBy = 'ASC' | 'DESC';
type TOrderByNulls = 'NULLS FIRST' | 'NULLS LAST';

export enum Operator {
  AND = '_and',
  OR = '_or',
}

export enum OperatorMethods {
  AND = 'andWhere',
  OR = 'orWhere',
}

interface IOrderByEntity {
  order: TOrderBy;
  nulls?: TOrderByNulls;
}

export const GQLToORMOrderByOperatorsMap: {
  [key in keyof IOrderByOperators]: IOrderByEntity;
} = {
  asc: { order: 'ASC' },
  desc: { order: 'DESC' },
  asc_nulls_first: { order: 'ASC', nulls: 'NULLS FIRST' },
  asc_nulls_last: { order: 'ASC', nulls: 'NULLS LAST' },
  desc_nulls_first: { order: 'DESC', nulls: 'NULLS FIRST' },
  desc_nulls_last: { order: 'DESC', nulls: 'NULLS LAST' },
};

export const GQLToORMOperationsMap = {
  _and: OperatorMethods.AND,
  _or: OperatorMethods.OR,
};

export interface ISetting {
  [key: string]: string;
}

export interface ISettingsSchema {
  aliasSchema?: ISetting;
  entitiesSchema?: ISetting;
}
