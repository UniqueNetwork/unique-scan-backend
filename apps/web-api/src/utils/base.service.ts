import { Equal, ILike, Like, Not, Brackets, SelectQueryBuilder } from 'typeorm';

import { IGQLQueryArgs, IWhereOperators, TWhereParams } from './gql-query-args';

type TOperatorsMap = {
  [key in keyof IWhereOperators]:
    | typeof Equal
    | typeof Not
    | typeof Like
    | typeof ILike;
};

const GQLToORMOperatorsMap: TOperatorsMap = {
  _eq: Equal,
  _neq: Not,
  _like: Like,
  _ilike: ILike,
};

const GQLToORMOperators = {
  _and: Brackets,
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

      qb.andWhere({ [field]: ormOperator(operators[operatorName]) });
    }
  }

  protected applyWhereCondition2(
    qb: SelectQueryBuilder<T>,
    args: IGQLQueryArgs<S>,
  ): void {
    if (!args.where) {
      return;
    }

    const generateWhereCondition = (
      whereOperators: TWhereParams<S>,
      needAddQuery = true,
    ) => {
      const whereCondition = {};
      for (const [field, operators] of Object.entries<IWhereOperators>(
        whereOperators,
      )) {
        const operatorNames = Object.keys(operators) as Array<
          keyof IWhereOperators
        >;

        const operatorName = operatorNames[0];
        const ormOperator = this.getOrmWhereOperator(operatorName);
        const additionalOperator = this.getOrmWhereConditionalOperator(field);

        if (ormOperator) {
          whereCondition[field] = ormOperator(operators[operatorName]);
        } else if (additionalOperator) {
          qb.andWhere(
            new additionalOperator((qb) =>
              qb.andWhere(generateWhereCondition(whereOperators[field], false)),
            ),
          );
        } else {
          throw new Error(`Unknown GQL condition operator '${operatorName}'.`);
        }
      }

      if (needAddQuery && Object.keys(whereCondition).length !== 0) {
        qb.andWhere(whereCondition);
      }

      return whereCondition;
    };

    generateWhereCondition(args.where);
  }

  private getOrmWhereOperator(
    gqlWhereOperator: keyof IWhereOperators,
  ): typeof Equal {
    const ormOperator = GQLToORMOperatorsMap[gqlWhereOperator];
    // if (!ormOperator) {
    //   throw new Error(`Unknown GQL condition operator '${gqlWhereOperator}'.`);
    // }
    return ormOperator;
  }

  private getOrmWhereConditionalOperator(
    gqlWhereOperator: string,
  ): typeof Brackets {
    return GQLToORMOperators[gqlWhereOperator];
  }
}
