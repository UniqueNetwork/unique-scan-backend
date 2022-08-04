import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Account } from '@entities/Account';
import { INestApplication, Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { AccountDTO } from '../account/account.dto';
import { AppModule } from '../app.module';
import { GQLOrderByParamsArgs, IGQLQueryArgs } from './gql-query-args';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';

@Injectable()
class BaseServiceTest extends BaseService<Account, AccountDTO> {
  constructor(@InjectRepository(Account) private repo: Repository<Account>) {
    super();
  }

  apply(queryArgs: IGQLQueryArgs<AccountDTO>) {
    const qb = this.repo.createQueryBuilder();

    qb.select('*');
    this.applyOrderCondition(qb, queryArgs);
    this.applyLimitOffset(qb, queryArgs);
    this.applyWhereCondition(qb, queryArgs);
    this.applyDistinctOn(qb, queryArgs);

    return qb;
  }
}

describe('BaseService', () => {
  let service: BaseServiceTest;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TypeOrmModule.forFeature([Account])],
      providers: [BaseServiceTest],
    }).compile();

    service = app.get<BaseServiceTest>(BaseServiceTest);
  });

  describe('base service with Account', () => {
    it('should return query "ORDER BY account_id DESC LIMIT 10 OFFSET 10"', async () => {
      const qb = service.apply({
        order_by: { account_id: GQLOrderByParamsArgs.desc },
        offset: 10,
        limit: 10,
      });

      expect(qb.getQuery()).toBe(
        'SELECT * FROM "public"."account" "Account" ORDER BY "Account"."account_id" DESC LIMIT 10 OFFSET 10',
      );
    });

    it('should return query "LIMIT 10 OFFSET 10"', async () => {
      const qb = service.apply({ offset: 10, limit: 10 });

      expect(qb.getQuery()).toBe(
        'SELECT * FROM "public"."account" "Account" LIMIT 10 OFFSET 10',
      );
    });

    it('should return query "DISTINCT ON (account_id) LIMIT 10"', async () => {
      const qb = service.apply({ distinct_on: 'account_id' });

      expect(qb.getQuery()).toBe(
        'SELECT DISTINCT ON (account_id) * FROM "public"."account" "Account" LIMIT 10',
      );
    });

    it('should return query without LIMIT', async () => {
      const qb = service.apply({ limit: null });

      expect(qb.getQuery()).toBe('SELECT * FROM "public"."account" "Account"');
    });

    it('should return correct condition WHERE', async () => {
      const qb = service.apply({
        where: {
          account_id: { _eq: 1 },
          available_balance: { _eq: 100 },
        },
      });

      expect(qb.getSql()).toBe(
        // eslint-disable-next-line max-len
        'SELECT * FROM "public"."account" "Account" WHERE "Account"."account_id" = $1 AND "Account"."available_balance" = $2 LIMIT 10',
      );

      const [orm_param_0, orm_param_1] = Object.values(qb.getParameters());
      expect(orm_param_0).toBe(1);
      expect(orm_param_1).toBe(100);
    });

    it('where with _or', async () => {
      const qb = service.apply({
        where: {
          _or: [
            {
              account_id: {
                _eq: 1,
              },
            },
            {
              available_balance: {
                _eq: 100,
              },
            },
          ],
        },
      });

      expect(qb.getSql()).toBe(
        // eslint-disable-next-line max-len
        'SELECT * FROM "public"."account" "Account" WHERE ("Account"."account_id" = $1 OR "Account"."available_balance" = $2) LIMIT 10',
      );

      const [orm_param_0, orm_param_1] = Object.values(qb.getParameters());
      expect(orm_param_0).toBe(1);
      expect(orm_param_1).toBe(100);
    });
  });
});
