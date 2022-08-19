import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { print } from 'graphql';
import * as request from 'supertest';
import { Fixtures } from '@common/test/fixtures';
import { gql } from 'apollo-server-express';
import { AppModule } from '../src/app.module';

describe('Account (e2e)', () => {
  let app: INestApplication;
  const fixtures = new Fixtures('apps/web-api/test/fixtures', 'account');
  const graphqlUrl = process.env.GRAPHQL_URL;

  beforeAll(async () => {
    await fixtures.loadFixtures();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await fixtures.clearFixtures();
  });

  describe('get list of accounts', () => {
    const query = print(
      gql`
        query getAccounts(
          $limit: Int
          $offset: Int
          $order_by: AccountOrderByParams
          $where: AccountWhereParams
        ) {
          accounts(
            limit: $limit
            offset: $offset
            order_by: $order_by
            where: $where
          ) {
            count
            data {
              account_id
              account_id_normalized
              available_balance
              block_height
              free_balance
              locked_balance
              timestamp
            }
          }
        }
      `,
    );

    it('should return list of accounts with default limit', async () => {
      const args = {
        order_by: {
          account_id: 'desc',
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.accounts.count).toBe(31);
          expect(res.body.data.accounts.data.length).toBe(10);

          expect(res.body.data.accounts.data[0].account_id).toBe(
            'yGJQYCM4cLQQiHb3H7ExKkZRCpgRHEdLTJjxuLrLtdq6X9xzj',
          );
          expect(res.body.data.accounts.data[0].account_id_normalized).toBe(
            '5Hjjaak1TgCxzMde7hYYPd3wUHj2cfG6FKcUcJgoXDpB15S',
          );
          expect(res.body.data.accounts.data[0].available_balance).toBe(
            '226.064588',
          );
          expect(res.body.data.accounts.data[0].block_height).toBe(934550);
          expect(res.body.data.accounts.data[0].free_balance).toBe(
            '226.064588',
          );
          expect(res.body.data.accounts.data[0].locked_balance).toBe('0');
          expect(res.body.data.accounts.data[0].nonce).toBe('132');
          expect(res.body.data.accounts.data[0].timestamp).toBe(1653962324);

          expect(res.body.data.accounts.data[3].account_id).toBe(
            'yGJ5ZJtxw29KZ2LN8WcmhpuE3LDJ5JV3uyUy5ZDS2fKk6ipDM',
          );
          expect(res.body.data.accounts.data[3].account_id_normalized).toBe(
            '5HQkh8eL9R7oj6xVX5MvTxrmypbpgWyYv4cepfmwYiTkZt5',
          );
          expect(res.body.data.accounts.data[3].available_balance).toBe(
            '32.47117910825487',
          );
          expect(res.body.data.accounts.data[3].block_height).toBe(934550);
          expect(res.body.data.accounts.data[3].free_balance).toBe(
            '89.14717627999904',
          );
          expect(res.body.data.accounts.data[3].locked_balance).toBe(
            '56675997171744160000',
          );
          expect(res.body.data.accounts.data[3].nonce).toBe('8');
          expect(res.body.data.accounts.data[3].timestamp).toBe(1653962322);
        });
    });

    it('should return one account', async () => {
      const args = {
        order_by: {
          account_id: 'desc',
        },
        limit: 1,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.accounts.count).toBe(31);
          expect(res.body.data.accounts.data.length).toBe(1);

          expect(res.body.data.accounts.data[0].account_id).toBe(
            'yGJQYCM4cLQQiHb3H7ExKkZRCpgRHEdLTJjxuLrLtdq6X9xzj',
          );
          expect(res.body.data.accounts.data[0].account_id_normalized).toBe(
            '5Hjjaak1TgCxzMde7hYYPd3wUHj2cfG6FKcUcJgoXDpB15S',
          );
          expect(res.body.data.accounts.data[0].available_balance).toBe(
            '226.064588',
          );
          expect(res.body.data.accounts.data[0].block_height).toBe(934550);
          expect(res.body.data.accounts.data[0].free_balance).toBe(
            '226.064588',
          );
          expect(res.body.data.accounts.data[0].locked_balance).toBe('0');
          expect(res.body.data.accounts.data[0].nonce).toBe('132');
          expect(res.body.data.accounts.data[0].timestamp).toBe(1653962324);
        });
    });

    it('should return last account', async () => {
      const args = {
        order_by: {
          account_id: 'desc',
        },
        offset: 30,
        limit: 1,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.accounts.count).toBe(31);
          expect(res.body.data.accounts.data.length).toBe(1);

          expect(res.body.data.accounts.data[0].account_id).toBe(
            'account_id_1',
          );
          expect(res.body.data.accounts.data[0].account_id_normalized).toBe(
            'asd',
          );
          expect(res.body.data.accounts.data[0].available_balance).toBe('1');
          expect(res.body.data.accounts.data[0].block_height).toBe(123);
          expect(res.body.data.accounts.data[0].free_balance).toBe('1');
          expect(res.body.data.accounts.data[0].locked_balance).toBe('1');
          expect(res.body.data.accounts.data[0].nonce).toBe('test_text');
          expect(res.body.data.accounts.data[0].timestamp).toBe(1653962321);
        });
    });

    it('should return two accounts', async () => {
      const args = {
        order_by: {
          account_id: 'desc',
        },
        where: {
          _or: [
            {
              account_id: {
                _eq: 'yGJQYCM4cLQQiHb3H7ExKkZRCpgRHEdLTJjxuLrLtdq6X9xzj',
              },
            },
            {
              account_id: {
                _eq: 'account_id_1',
              },
            },
          ],
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.accounts.count).toBe(2);
          expect(res.body.data.accounts.data.length).toBe(2);

          expect(res.body.data.accounts.data[0].account_id).toBe(
            'yGJQYCM4cLQQiHb3H7ExKkZRCpgRHEdLTJjxuLrLtdq6X9xzj',
          );
          expect(res.body.data.accounts.data[0].account_id_normalized).toBe(
            '5Hjjaak1TgCxzMde7hYYPd3wUHj2cfG6FKcUcJgoXDpB15S',
          );
          expect(res.body.data.accounts.data[0].available_balance).toBe(
            '226.064588',
          );
          expect(res.body.data.accounts.data[0].block_height).toBe(934550);
          expect(res.body.data.accounts.data[0].free_balance).toBe(
            '226.064588',
          );
          expect(res.body.data.accounts.data[0].locked_balance).toBe('0');
          expect(res.body.data.accounts.data[0].nonce).toBe('132');
          expect(res.body.data.accounts.data[0].timestamp).toBe(1653962324);

          expect(res.body.data.accounts.data[1].account_id).toBe(
            'account_id_1',
          );
          expect(res.body.data.accounts.data[1].account_id_normalized).toBe(
            'asd',
          );
          expect(res.body.data.accounts.data[1].available_balance).toBe('1');
          expect(res.body.data.accounts.data[1].block_height).toBe(123);
          expect(res.body.data.accounts.data[1].free_balance).toBe('1');
          expect(res.body.data.accounts.data[1].locked_balance).toBe('1');
          expect(res.body.data.accounts.data[1].nonce).toBe('test_text');
          expect(res.body.data.accounts.data[1].timestamp).toBe(1653962321);
        });
    });

    it('should apply offset and return data length === limit', async () => {
      const args = {
        order_by: {
          account_id: 'desc',
        },
        offset: 10,
        limit: 3,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.accounts.count).toBe(31);
          expect(res.body.data.accounts.data.length).toBe(args.limit);
        });
    });
  });
});
