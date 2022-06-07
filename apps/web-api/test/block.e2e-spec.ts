import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { print } from 'graphql';
import * as request from 'supertest';
import { Fixtures } from '@common/test/loadFixtures';
import { gql } from 'apollo-server-express';
import { AppModule } from '../src/app.module';

describe('Block (e2e)', () => {
  let app: INestApplication;
  const fixtures = new Fixtures();
  const graphqlUrl = '/v1/graphql';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await fixtures.loadFixtures('apps/web-api/test/fixtures');

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await fixtures.clearFixtures();
  });

  describe('get list of block', () => {
    const query = print(
      gql`
        query getBlocks(
          $limit: Int
          $offset: Int
          $order_by: BlockOrderByParams
          $where: BlockWhereParams
        ) {
          blocks(
            limit: $limit
            offset: $offset
            order_by: $order_by
            where: $where
          ) {
            count
            data {
              block_number
              block_hash
              parent_hash
              extrinsics_root
              state_root
              session_length
              spec_name
              spec_version
              total_events
              num_transfers
              new_accounts
              total_issuance
              timestamp
              need_rescan
              total_extrinsics
            }
          }
        }
      `,
    );

    it('should return list of blocks with default limit', async () => {
      const args = {
        order_by: {
          account_id: 'desc',
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          // expect(res.body.data.block.count).toBe(31);
          // expect(res.body.data.block.data.length).toBe(10);
          //
          // expect(res.body.data.block.data[0].account_id).toBe(
          //   'yGJQYCM4cLQQiHb3H7ExKkZRCpgRHEdLTJjxuLrLtdq6X9xzj',
          // );
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
          // expect(res.body.data.block.count).toBe(31);
          // expect(res.body.data.block.data.length).toBe(1);
          //
          // expect(res.body.data.block.data[0].account_id).toBe(
          //   'yGJQYCM4cLQQiHb3H7ExKkZRCpgRHEdLTJjxuLrLtdq6X9xzj',
          // );
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
          // expect(res.body.data.block.count).toBe(31);
          // expect(res.body.data.block.data.length).toBe(1);
          //
          // expect(res.body.data.block.data[0].account_id).toBe('account_id_1');
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
          // expect(res.body.data.block.count).toBe(2);
          // expect(res.body.data.block.data.length).toBe(2);
          //
          // expect(res.body.data.block.data[0].account_id).toBe(
          //   'yGJQYCM4cLQQiHb3H7ExKkZRCpgRHEdLTJjxuLrLtdq6X9xzj',
          // );
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
          // expect(res.body.data.block.count).toBe(31);
          // expect(res.body.data.block.data.length).toBe(args.limit);
        });
    });
  });
});
