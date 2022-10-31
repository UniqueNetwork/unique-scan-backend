import { Brackets, SelectQueryBuilder } from 'typeorm';
import { isEmpty, random } from 'lodash';

import { IGQLQueryArgs, IWhereOperators, TWhere } from './gql-query-args';
import {
  GQLToORMOperationsMap,
  GQLToORMOperatorsDict,
  GQLToORMOrderByOperatorsMap,
  IRelations,
  ISetting,
  ISettingsSchema,
  Operator,
  OperatorMethods,
  TParamValue,
} from './base.service.types';
import { FieldsListOptions, fieldsMap } from 'graphql-fields-list';
import { GraphQLResolveInfo } from 'graphql';
import { JOIN_TYPE } from '@common/constants';

export class BaseService<T, S> {
  private readonly DEFAULT_PAGE_SIZE = 10;
  protected readonly aliasFields: ISetting = {};
  protected readonly relationsFields: ISetting = {};
  protected readonly customQueryFields: ISetting = {};
  private readonly relations: string[] = [];

  constructor(schemas: ISettingsSchema = {}) {
    const {
      aliasFields = {},
      relationsFields = {},
      customQueryFields = {},
      relations = [],
    } = schemas;
    this.aliasFields = aliasFields;
    this.relationsFields = relationsFields;
    this.relations = relations;
    this.customQueryFields = customQueryFields;
  }

  protected getQueryFields(
    info: GraphQLResolveInfo,
    options: FieldsListOptions = { path: 'data', skip: ['__*', 'data.__*'] },
  ) {
    return fieldsMap(info, options);
  }

  private getQuerySelectionAndAlias(
    qb: SelectQueryBuilder<T>,
    queryField: string,
  ): {
    selection: string;
    alias: string | undefined;
  } {
    const selection =
      this.customQueryFields[queryField] ||
      this.getConditionField(qb, queryField);

    const alias =
      this.customQueryFields[queryField] || this.aliasFields[queryField]
        ? queryField
        : undefined;

    // console.log(queryField, selection, alias);

    return {
      selection,
      alias,
    };
  }

  protected applySelect(
    qb: SelectQueryBuilder<T>,
    queryFields: S,
    relations: IRelations = {},
  ) {
    let firstSelect = true;
    const usedRelalations = new Set();

    // Add query fields
    Object.entries(queryFields).forEach(([field, v]) => {
      if (typeof v !== 'object') {
        usedRelalations.add(this.relationsFields[field]);

        const { selection, alias } = this.getQuerySelectionAndAlias(qb, field);

        if (firstSelect) {
          qb.select(selection, alias);
          firstSelect = false;
        } else {
          qb.addSelect(selection, alias);
        }
      }
    });

    // Process relations
    Object.entries(relations).forEach(([relation, descriptor]) => {
      if (usedRelalations.has(relation)) {
        const { table, on, join = JOIN_TYPE.LEFT } = descriptor;

        switch (join) {
          case JOIN_TYPE.LEFT:
            qb.leftJoin(table, relation, on);
            break;
          case JOIN_TYPE.INNER:
            qb.innerJoin(table, relation, on);
            break;
        }

        usedRelalations.delete(relation);
      }
    });
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
      qb.distinctOn([this.getConditionField(qb, args.distinct_on)]);

      // if order_by: {[args.distinct_on]: undefined | null} condition
      // order_by required args.distinct_on in condition
      // and he should be first order
      if (
        args.order_by &&
        !args.order_by[args.distinct_on] &&
        Object.keys(args.order_by).length
      ) {
        const { order } = GQLToORMOrderByOperatorsMap.desc;
        qb.orderBy();
        qb.addOrderBy(this.getConditionField(qb, args.distinct_on), order);
        this.applyOrderCondition(qb, args);
      }
    }
  }

  protected async getCount(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
  ): Promise<number> {
    if (args.distinct_on) {
      const query = qb.clone();

      query
        .distinctOn([])
        .orderBy()
        .offset(undefined)
        .limit(undefined)
        .skip(undefined)
        .take(undefined)
        .select(
          `COUNT(DISTINCT(${this.getConditionField(qb, args.distinct_on)}))`,
          'count',
        );

      const { count } = (await query.getRawOne()) as { count: number };
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

  protected async getDataAndCount(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
  ) {
    const data = await qb.getRawMany();
    let count = 0;
    if (data?.length) {
      count = await this.getCount(qb, args);
    }

    return { data, count };
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
      case '_is_null':
        query = `${fieldWithAlias} ${value ? 'is null' : 'is not null'}`;
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

  protected getConditionField(
    qb: SelectQueryBuilder<T>,
    field: string,
  ): string {
    return `"${this.relationsFields[field] ?? qb.alias}"."${
      this.aliasFields[field] ?? field
    }"`;
  }

  protected formatDate(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }
}
