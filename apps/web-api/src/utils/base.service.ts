import { Brackets, FindOperator, SelectQueryBuilder } from 'typeorm';
import { isEmpty } from 'lodash';

import { IGQLQueryArgs, IWhereOperators, TWhereParams } from './gql-query-args';
import {
  GQLToORMOperationsMap,
  GQLToORMOperatorsMap,
  GQLToORMOrderByOperatorsMap,
  ISetting,
  ISettingsSchema,
  Operator,
  OperatorMethods,
  TWhereCondition,
} from './base.service.types';

export class BaseService<T, S> {
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly aliasSchema: ISetting = {};
  private readonly entitiesSchema: ISetting = {};

  constructor(schemas: ISettingsSchema = {}) {
    const { aliasSchema = {}, entitiesSchema = {} } = schemas;
    this.aliasSchema = aliasSchema;
    this.entitiesSchema = entitiesSchema;
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

    for (const field in args.order_by) {
      const operator = args.order_by[field];

      const query = GQLToORMOrderByOperatorsMap[operator];
      if (!query) {
        throw new Error(`Unknown GQL order by operator '${operator}'.`);
      }

      qb.addOrderBy(this.getOrderField(qb, field), query.order, query.nulls);
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
            qb,
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

        qb[method](this.getFilterCondition(field, ormOperator(value)));
      });
    }
  }

  private addSubQuery(
    qb: SelectQueryBuilder<T>,
    where: TWhereParams<S>,
    operator: Operator,
  ) {
    return new Brackets(() =>
      where[operator].map((queryArray) => {
        this.applyConditionTree(qb, queryArray, operator);
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

  private getOrderField(qb: SelectQueryBuilder<T>, key: string): string {
    return `"${this.entitiesSchema[key] ?? qb.alias}"."${
      this.aliasSchema[key] ?? key
    }"`;
  }

  private getFilterCondition(field: string, value: FindOperator<any>) {
    if (this.entitiesSchema[field]) {
      return {
        [this.entitiesSchema[field]]: {
          [field]: value,
        },
      };
    }

    return { [field]: value };
  }
}
