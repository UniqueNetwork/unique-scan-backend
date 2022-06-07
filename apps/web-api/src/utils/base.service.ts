import {
  Equal,
  ILike,
  Like,
  Not,
  In,
  Brackets,
  SelectQueryBuilder,
  FindOperator,
} from 'typeorm';
import { isEmpty } from 'lodash';

import {
  IGQLQueryArgs,
  IWhereOperators,
  TWhereParams,
  IOrderByOperators,
  IWhereOperations,
} from './gql-query-args';

type TWhereCondition =
  | typeof Equal
  | typeof Not
  | typeof Like
  | typeof ILike
  | typeof In;

type TOperatorsMap = {
  [key in keyof IWhereOperations]: TWhereCondition;
};

type TWhereValue = (string | FindOperator<string>) &
  (string[] | FindOperator<string>) &
  (number | FindOperator<number>) &
  (number[] | FindOperator<number>);

const GQLToORMOperatorsMap: TOperatorsMap = {
  _eq: Equal,
  _neq: Not,
  _like: Like,
  _ilike: ILike,
  _in: In,
};

type TOrderBy = 'ASC' | 'DESC';
type TOrderByNulls = 'NULLS FIRST' | 'NULLS LAST';

enum Operator {
  AND = '_and',
  OR = '_or',
}

enum OperatorMethods {
  AND = 'andWhere',
  OR = 'orWhere',
}

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
  _and: OperatorMethods.AND,
  _or: OperatorMethods.OR,
};

interface IAliasObject {
  [key: string]: string;
}

export class BaseService<T, S> {
  readonly DEFAULT_PAGE_SIZE = 10;
  private aliasSchema: IAliasObject = {};

  public applyAliasSchema(schema: IAliasObject) {
    this.aliasSchema = schema;
  }

  protected applyLimitOffset(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
  ): void {
    if (args.limit !== null) {
      if (args.limit) {
        qb.limit(args.limit);
      } else {
        qb.limit(this.DEFAULT_PAGE_SIZE);
      }
    }

    if (args.offset) {
      qb.offset(args.offset);
    }
  }

  protected applyDistinctOn(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
  ): void {
    if (args.distinct_on) {
      qb.distinctOn([args.distinct_on]);
    }
  }

  protected async getCountByFilters(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
  ): Promise<number> {
    if (args.distinct_on) {
      qb.distinctOn([]);
      const { count } = (await qb
        .select(`COUNT(DISTINCT(${qb.alias}.${args.distinct_on}))`, 'count')
        .getRawOne()) as { count: number };

      return count;
    }

    return qb.getCount();
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
      qb.addOrderBy(`"${qb.alias}"."${key}"`, query.order, query.nulls);
    }
  }

  protected applyWhereCondition(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
  ): void {
    if (!isEmpty(args.where)) {
      this.applyConditionTree(qb, args.where);
    }
  }

  private applyConditionTree(
    qb: SelectQueryBuilder<T>,
    where: TWhereParams<S>,
    upperOperator = Operator.AND,
  ): void {
    Object.keys(where).forEach((op) => {
      const operator = this.getOrmWhereOperation(op);

      if (operator) {
        qb[operator](
          this.addSubQuery(
            where,
            operator === OperatorMethods.AND ? Operator.AND : Operator.OR,
          ),
        );
      } else {
        const whereEntity = { [op]: where[op] } as TWhereParams<S>;
        this.setWhereConditionValue(
          qb,
          whereEntity,
          upperOperator === Operator.AND
            ? OperatorMethods.AND
            : OperatorMethods.OR,
        );
      }
    });
  }

  private setWhereConditionValue(
    qb: SelectQueryBuilder<T>,
    where: TWhereParams<S>,
    method: OperatorMethods,
  ): void {
    for (const [field, operators] of Object.entries<IWhereOperators>(where)) {
      Object.entries(operators).forEach((parameters) => {
        const [operation, value] = parameters;
        const ormOperator = this.getOrmWhereOperator(
          operation as keyof IWhereOperators,
        );

        if (!operation) {
          throw new Error(`Unknown GQL condition operator '${operation}'.`);
        }

        qb[method]({
          [this.aliasSchema[field] ?? field]: ormOperator(value as TWhereValue),
        });
      });
    }
  }

  private addSubQuery(where: TWhereParams<S>, operator: Operator) {
    return new Brackets((qb) =>
      where[operator].map((queryArray) => {
        this.applyConditionTree(
          qb as SelectQueryBuilder<T>,
          queryArray,
          operator,
        );
      }),
    );
  }

  private getOrmWhereOperator(
    gqlWhereOperator: keyof IWhereOperators,
  ): TWhereCondition {
    return GQLToORMOperatorsMap[gqlWhereOperator];
  }

  private getOrmWhereOperation(gqlWhereOperator: string): OperatorMethods {
    return GQLToORMOperationsMap[gqlWhereOperator];
  }
}
