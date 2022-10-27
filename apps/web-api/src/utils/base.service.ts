import { Brackets, SelectQueryBuilder } from 'typeorm';
import { isEmpty, random } from 'lodash';

import { IGQLQueryArgs, IWhereOperators, TWhere } from './gql-query-args';
import {
  GQLToORMOperationsMap,
  GQLToORMOperatorsDict,
  GQLToORMOrderByOperatorsMap,
  ISetting,
  ISettingsSchema,
  Operator,
  OperatorMethods,
  TParamValue,
} from './base.service.types';

export class BaseService<T, S> {
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly aliasFields: ISetting = {};
  private readonly relationsFields: ISetting = {};
  private readonly relations: string[] = [];

  constructor(schemas: ISettingsSchema = {}) {
    const { aliasFields = {}, relationsFields = {}, relations = [] } = schemas;
    this.aliasFields = aliasFields;
    this.relationsFields = relationsFields;
    this.relations = relations;
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

      qb.addOrderBy(
        this.getConditionField(qb, field),
        query.order,
        query.nulls,
      );
    }
  }

  protected applyWhereCondition(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
    filterCb?: (
      qb: SelectQueryBuilder<T>,
      where: TWhere<S>,
      method: OperatorMethods,
    ) => void,
  ): void {
    if (!isEmpty(args.where)) {
      this.applyConditionTree(qb, args.where, Operator.AND, filterCb);
    }
  }

  private applyConditionTree(
    qb: SelectQueryBuilder<T>,
    where: TWhere<S>,
    upperOperator = Operator.AND,
    filterCb?: (
      qb: SelectQueryBuilder<T>,
      where: TWhere<S>,
      method: OperatorMethods,
    ) => void,
  ): void {
    Object.keys(where).forEach((op) => {
      const operator = this.getOrmWhereOperation(op);

      if (operator) {
        this.addSubQuery(
          qb,
          where,
          operator === OperatorMethods.AND ? Operator.AND : Operator.OR,
          operator,
          filterCb,
        );
      } else {
        const method =
          upperOperator === Operator.AND
            ? OperatorMethods.AND
            : OperatorMethods.OR;

        if (typeof filterCb === 'function' && this.relations?.includes(op)) {
          filterCb(qb, where[op], method);
        } else {
          const whereEntity = { [op]: where[op] } as TWhere<S>;
          this.setWhereConditionExpression(qb, whereEntity, method);
        }
      }
    });
  }

  private setWhereConditionExpression(
    qb: SelectQueryBuilder<T>,
    where: TWhere<S>,
    method: OperatorMethods,
  ): void {
    for (const [field, operators] of Object.entries<IWhereOperators>(where)) {
      Object.entries(operators).forEach((parameters) => {
        const [operation, value] = parameters;

        if (Array.isArray(value) && !value.length) {
          return;
        }

        const { query, params } = this.createWhereConditionExpression(
          qb,
          field,
          value,
          operation as keyof IWhereOperators,
        );

        qb[method](query, params);
      });
    }
  }

  private addSubQuery(
    qb: SelectQueryBuilder<T>,
    where: TWhere<S>,
    operator: Operator,
    method: OperatorMethods,
    filterCb?: (
      qb: SelectQueryBuilder<T>,
      where: TWhere<S>,
      method: OperatorMethods,
    ) => void,
  ) {
    qb[method](
      new Brackets((qb) => {
        where[operator].forEach((queryArray) => {
          qb[method](
            new Brackets((qb) =>
              this.applyConditionTree(
                qb as SelectQueryBuilder<T>,
                queryArray,
                operator,
                filterCb,
              ),
            ),
          );
        });
      }),
    );
  }

  private createWhereConditionExpression(
    qb: SelectQueryBuilder<T>,
    field: string,
    value: TParamValue,
    op: keyof IWhereOperators,
  ) {
    const fieldWithAlias = this.getConditionField(qb, field);
    const paramName = `${field}_${Date.now()}_${random(1, 1000)}`;
    const operation = this.getOrmWhereOperator(op);
    let query = '';

    switch (op) {
      case '_in':
        query = `${fieldWithAlias} ${operation} (:...${paramName})`;
        break;
      case '_like':
      case '_ilike':
      case '_eq':
      case '_neq':
        query = `${fieldWithAlias} ${operation} :${paramName}`;
        break;
      default:
        throw new Error(`Unknown filter operation: ${op}`);
    }

    return {
      query,
      params: { [paramName]: value },
    };
  }

  private getOrmWhereOperator(gqlWhereOperator: keyof IWhereOperators) {
    return GQLToORMOperatorsDict[gqlWhereOperator];
  }

  private getOrmWhereOperation(gqlWhereOperator: string): OperatorMethods {
    return GQLToORMOperationsMap[gqlWhereOperator];
  }

  private getConditionField(qb: SelectQueryBuilder<T>, field: string): string {
    return `"${this.relationsFields[field] ?? qb.alias}"."${
      this.aliasFields[field] ?? field
    }"`;
  }

  protected formatDate(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }
}
