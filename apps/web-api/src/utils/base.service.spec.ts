import { Test, TestingModule } from '@nestjs/testing';
import { createQueryBuilder } from 'typeorm';
import { Account } from '@entities/Account';
import { INestApplication } from '@nestjs/common';
import { BaseService } from './base.service';
import { AccountDTO } from '../account/account.dto';
import { AppModule } from '../app.module';
import { GQLOrderByParamsArgs, IGQLQueryArgs } from './gql-query-args';

describe('BaseService', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('base service with Acoount', () => {
    class ForTests extends BaseService<Account, AccountDTO> {
      apply(queryArgs: IGQLQueryArgs<AccountDTO>) {
        const qb = createQueryBuilder().from(Account, 'Account');

        this.applyOrderCondition(qb, queryArgs);
        this.applyLimitOffset(qb, queryArgs);
        this.applyWhereCondition(qb, queryArgs);
        this.applyDistinctOn(qb, queryArgs);

        return qb;
      }
    }

    it('should return query "ORDER BY account_id DESC LIMIT 10 OFFSET 10"', async () => {
      const service = new ForTests();
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
      const service = new ForTests();
      const qb = service.apply({ offset: 10, limit: 10 });

      expect(qb.getQuery()).toBe(
        'SELECT * FROM "public"."account" "Account" LIMIT 10 OFFSET 10',
      );
    });

    it('should return query "DISTINCT ON (account_id) LIMIT 10"', async () => {
      const service = new ForTests();
      const qb = service.apply({ distinct_on: 'account_id' });

      expect(qb.getQuery()).toBe(
        'SELECT DISTINCT ON (account_id) * FROM "public"."account" "Account" LIMIT 10',
      );
    });

    it('should return query without LIMIT', async () => {
      const service = new ForTests();
      const qb = service.apply({ limit: null });

      expect(qb.getQuery()).toBe('SELECT * FROM "public"."account" "Account"');
    });

    it('should return correct condition WHERE', async () => {
      const service = new ForTests();
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
  });
});
