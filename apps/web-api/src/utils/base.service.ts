import { Equal, ILike, Like, Not, SelectQueryBuilder } from 'typeorm';
import {
  IGQLQueryArgs,
  IOrderByOperators,
  IWhereOperators,
} from './gql-query-args';

type TWhereOperatorsMap = {
  [key in keyof IWhereOperators]:
    | typeof Equal
    | typeof Not
    | typeof Like
    | typeof ILike;
};

const GQLToORMWhereOperatorsMap: TWhereOperatorsMap = {
  _eq: Equal,
  _neq: Not,
  _like: Like,
  _ilike: ILike,
};

type TOrderBy = 'ASC' | 'DESC';
type TOrderByNulls = 'NULLS FIRST' | 'NULLS LAST';

interface IOrderByEntity {
  order: TOrderBy;
  nulls?: TOrderByNulls;
}

const GQLToORMOrderByOperatorsMap: {
  [key in keyof IOrderByOperators]: IOrderByEntity;
} = {
  asc: { order: 'ASC' },
  desc: { order: 'DESC' },
  asc_nulls_first: { order: 'ASC', nulls: 'NULLS FIRST' },
  asc_nulls_last: { order: 'ASC', nulls: 'NULLS LAST' },
  desc_nulls_first: { order: 'DESC', nulls: 'NULLS FIRST' },
  desc_nulls_last: { order: 'DESC', nulls: 'NULLS LAST' },
};

export class BaseService<T, S> {
  readonly DEFAULT_PAGE_SIZE = 10;

  protected applyLimitOffset(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
  ): void {
    if (args.limit) {
      qb.limit(args.limit);
    } else {
      qb.limit(this.DEFAULT_PAGE_SIZE);
    }

    if (args.offset) {
      qb.offset(args.offset);
    }
  }

  protected applyWhereCondition(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
  ): void {
    if (!args.where) {
      return;
    }

    const whereCondition = {};
    for (const [field, operators] of Object.entries<IWhereOperators>(
      args.where,
    )) {
      const operatorNames = Object.keys(operators) as Array<
        keyof IWhereOperators
      >;

      if (operatorNames.length !== 1) {
        throw new Error(
          'For every field you should use only one condition operator.',
        );
      }
      const operatorName = operatorNames[0];
      const ormOperator = this.getOrmWhereOperator(operatorName);
      whereCondition[field] = ormOperator(operators[operatorName]);
    }
    qb.andWhere(whereCondition);
  }

  protected applyOrderCondition(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
  ): void {
    if (!args.order_by) {
      return;
    }

    for (const key in args.order_by) {
      const operator = args.order_by[key];

      const query = GQLToORMOrderByOperatorsMap[operator];
      if (!query) {
        throw new Error(`Unknown GQL order by operator '${operator}'.`);
      }
      if (query) qb.addOrderBy(key, query.order, query.nulls);
    }
  }

  private getOrmWhereOperator(
    gqlWhereOperator: keyof IWhereOperators,
  ): typeof Equal {
    const ormOperator = GQLToORMWhereOperatorsMap[gqlWhereOperator];
    if (!ormOperator) {
      throw new Error(`Unknown GQL condition operator '${gqlWhereOperator}'.`);
    }
    return ormOperator;
  }
}
