import { Equal, ILike, Like, Not, Brackets, SelectQueryBuilder } from 'typeorm';

import {
  IGQLQueryArgs,
  IWhereOperators,
  TWhereParams,
  IOrderByOperators,
} from './gql-query-args';

type TWhereCondition = typeof Equal | typeof Not | typeof Like | typeof ILike;

type TOperatorsMap = {
  [key in keyof IWhereOperators]: TWhereCondition;
};

const GQLToORMOperatorsMap: TOperatorsMap = {
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

const GQLToORMOperationsMap = {
  _and: 'AND',
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

    const subConditions = [];
    const generateWhereCondition = (whereOperators: TWhereParams<S>) => {
      const whereCondition = {};
      for (const [field, operators] of Object.entries<IWhereOperators>(
        whereOperators,
      )) {
        const operatorNames = Object.keys(operators) as Array<
          keyof IWhereOperators
        >;

        const operatorName = operatorNames[0];
        const ormOperator = this.getOrmWhereOperator(operatorName);
        const ormOperation = this.getOrmWhereOperation(field);

        if (ormOperator) {
          whereCondition[field] = ormOperator(operators[operatorName]);
        } else if (ormOperation) {
          subConditions.push(generateWhereCondition(whereOperators[field]));
        } else {
          throw new Error(`Unknown GQL condition operator '${operatorName}'.`);
        }
      }
      return whereCondition;
    };

    const condition = generateWhereCondition(args.where);
    qb.andWhere(condition);
    this.applySubWhere(qb, subConditions);
  }

  private applySubWhere(
    qb: SelectQueryBuilder<T>,
    conditions: TWhereCondition[],
  ) {
    if (!conditions.length) return;
    qb.andWhere(this.getSubQueryCondition(conditions.pop(), conditions));
  }

  private getSubQueryCondition(
    condition: TWhereCondition,
    nextConditions?: TWhereCondition[],
  ) {
    return new Brackets((qb) => {
      qb.andWhere(condition);
      if (nextConditions?.length) {
        qb.andWhere(
          this.getSubQueryCondition(nextConditions.pop(), nextConditions),
        );
      }
    });
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
      qb.addOrderBy(key, query.order, query.nulls);
    }
  }

  private getOrmWhereOperator(
    gqlWhereOperator: keyof IWhereOperators,
  ): typeof Equal {
    return GQLToORMOperatorsMap[gqlWhereOperator];
  }

  private getOrmWhereOperation(gqlWhereOperator: string): string {
    return GQLToORMOperationsMap[gqlWhereOperator];
  }
}
