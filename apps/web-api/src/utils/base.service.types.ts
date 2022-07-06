import { IOrderByOperators } from './gql-query-args';

export const GQLToORMOperatorsDict = {
  _eq: '=',
  _neq: '!=',
  _like: 'LIKE',
  _ilike: 'ILIKE',
  _in: 'IN',
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
  aliasFields?: ISetting;
  relationsFields?: ISetting;
  relations?: string[];
}

export type TParamValue = string | number | Array<string | number>;
