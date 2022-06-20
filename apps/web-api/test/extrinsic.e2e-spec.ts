import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { print } from 'graphql';
import * as request from 'supertest';
import { Fixtures } from '@common/test/fixtures';
import { gql } from 'apollo-server-express';
import { AppModule } from '../src/app.module';

describe('Extrinsic (e2e)', () => {
  let app: INestApplication;
  const fixtures = new Fixtures('apps/web-api/test/fixtures', 'extrinsic');
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

  describe('get list of extrinsic', () => {
    const query = print(
      gql`
        query getExtrinsic(
          $limit: Int
          $offset: Int
          $order_by: ExtrinsicOrderByParams
          $where: ExtrinsicWhereParams
        ) {
          extrinsics(
            limit: $limit
            offset: $offset
            order_by: $order_by
            where: $where
          ) {
            count
            data {
              block_index
              block_number
              from_owner
              from_owner_normalized
              to_owner
              to_owner_normalized
              hash
              success
              timestamp
              method
              section
              amount
              fee
            }
          }
        }
      `,
    );

    it('should return list of extrinsics', async () => {
      const args = {
        order_by: {
          block_number: 'desc',
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.extrinsics.count).toBe(33);
          expect(res.body.data.extrinsics.data.length).toBe(10);

          expect(res.body.data.extrinsics.data[0].block_index).toBe(
            '123305-33',
          );
          expect(res.body.data.extrinsics.data[0].block_number).toBe(
            '12330533',
          );
          expect(res.body.data.extrinsics.data[0].from_owner).toBe(
            'yGGE6ussbUFLGG1MaLJ11JK8AbeM4TKKQsCPmEUGvVsWzdFGZ33',
          );
          expect(res.body.data.extrinsics.data[0].from_owner_normalized).toBe(
            '5FZJJ7YzbX8WxmwwLkbDwNkuFFeoqMF3on3LVvcqPGEeUAYo33',
          );
          expect(res.body.data.extrinsics.data[0].to_owner).toBe(
            'yGCjr31X6CRM3PZWyE8x4WyZRXhdg9gV1bjuog8SYGwhZekfV33',
          );
          expect(res.body.data.extrinsics.data[0].to_owner_normalized).toBe(
            '5C53RFCVKh9J6L7LEbYHA3CABJwRXiQeYKZNwanTALRDVkP633',
          );
          expect(res.body.data.extrinsics.data[0].hash).toBe(
            '0xb43c353f3745b5450dd76d29729721a7f91c023f1648872b448a71e179ca7c8b33',
          );
          expect(res.body.data.extrinsics.data[0].success).toBe(true);
          expect(res.body.data.extrinsics.data[0].timestamp).toBe(1639688886);
          expect(res.body.data.extrinsics.data[0].method).toBe('transfer');
          expect(res.body.data.extrinsics.data[0].section).toBe('balances');
          expect(res.body.data.extrinsics.data[0].amount).toBe(33);
          expect(res.body.data.extrinsics.data[0].fee).toBe(33);

          expect(res.body.data.extrinsics.data[5].block_index).toBe(
            '123305-28',
          );
          expect(res.body.data.extrinsics.data[5].block_number).toBe(
            '12330528',
          );
          expect(res.body.data.extrinsics.data[5].from_owner).toBe(
            'yGGE6ussbUFLGG1MaLJ11JK8AbeM4TKKQsCPmEUGvVsWzdFGZ28',
          );
          expect(res.body.data.extrinsics.data[5].from_owner_normalized).toBe(
            '5FZJJ7YzbX8WxmwwLkbDwNkuFFeoqMF3on3LVvcqPGEeUAYo28',
          );
          expect(res.body.data.extrinsics.data[5].to_owner).toBe(
            'yGCjr31X6CRM3PZWyE8x4WyZRXhdg9gV1bjuog8SYGwhZekfV28',
          );
          expect(res.body.data.extrinsics.data[5].to_owner_normalized).toBe(
            '5C53RFCVKh9J6L7LEbYHA3CABJwRXiQeYKZNwanTALRDVkP628',
          );
          expect(res.body.data.extrinsics.data[5].hash).toBe(
            '0xb43c353f3745b5450dd76d29729721a7f91c023f1648872b448a71e179ca7c8b28',
          );
          expect(res.body.data.extrinsics.data[5].success).toBe(true);
          expect(res.body.data.extrinsics.data[5].timestamp).toBe(1639688886);
          expect(res.body.data.extrinsics.data[5].method).toBe('transfer');
          expect(res.body.data.extrinsics.data[5].section).toBe('balances');
          expect(res.body.data.extrinsics.data[5].amount).toBe(28);
          expect(res.body.data.extrinsics.data[5].fee).toBe(28);
        });
    });

    it('should return one extrinsic', async () => {
      const args = {
        order_by: {
          block_number: 'desc',
        },
        limit: 1,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.extrinsics.count).toBe(33);
          expect(res.body.data.extrinsics.data.length).toBe(1);

          expect(res.body.data.extrinsics.data[0].block_index).toBe(
            '123305-33',
          );
          expect(res.body.data.extrinsics.data[0].block_number).toBe(
            '12330533',
          );
          expect(res.body.data.extrinsics.data[0].from_owner).toBe(
            'yGGE6ussbUFLGG1MaLJ11JK8AbeM4TKKQsCPmEUGvVsWzdFGZ33',
          );
          expect(res.body.data.extrinsics.data[0].from_owner_normalized).toBe(
            '5FZJJ7YzbX8WxmwwLkbDwNkuFFeoqMF3on3LVvcqPGEeUAYo33',
          );
          expect(res.body.data.extrinsics.data[0].to_owner).toBe(
            'yGCjr31X6CRM3PZWyE8x4WyZRXhdg9gV1bjuog8SYGwhZekfV33',
          );
          expect(res.body.data.extrinsics.data[0].to_owner_normalized).toBe(
            '5C53RFCVKh9J6L7LEbYHA3CABJwRXiQeYKZNwanTALRDVkP633',
          );
          expect(res.body.data.extrinsics.data[0].hash).toBe(
            '0xb43c353f3745b5450dd76d29729721a7f91c023f1648872b448a71e179ca7c8b33',
          );
          expect(res.body.data.extrinsics.data[0].success).toBe(true);
          expect(res.body.data.extrinsics.data[0].timestamp).toBe(1639688886);
          expect(res.body.data.extrinsics.data[0].method).toBe('transfer');
          expect(res.body.data.extrinsics.data[0].section).toBe('balances');
          expect(res.body.data.extrinsics.data[0].amount).toBe(33);
          expect(res.body.data.extrinsics.data[0].fee).toBe(33);
        });
    });

    it('filter by alias fields. Should return one extrinsic', async () => {
      const args = {
        order_by: {
          block_number: 'asc',
        },
        where: {
          from_owner: {
            _eq: 'yGGE6ussbUFLGG1MaLJ11JK8AbeM4TKKQsCPmEUGvVsWzdFGZ22',
          },
        },
        limit: 1,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.extrinsics.count).toBe(1);
          expect(res.body.data.extrinsics.data.length).toBe(1);

          expect(res.body.data.extrinsics.data[0].block_index).toBe(
            '123305-22',
          );
          expect(res.body.data.extrinsics.data[0].block_number).toBe(
            '12330522',
          );
          expect(res.body.data.extrinsics.data[0].from_owner).toBe(
            'yGGE6ussbUFLGG1MaLJ11JK8AbeM4TKKQsCPmEUGvVsWzdFGZ22',
          );
          expect(res.body.data.extrinsics.data[0].from_owner_normalized).toBe(
            '5FZJJ7YzbX8WxmwwLkbDwNkuFFeoqMF3on3LVvcqPGEeUAYo22',
          );
          expect(res.body.data.extrinsics.data[0].to_owner).toBe(
            'yGCjr31X6CRM3PZWyE8x4WyZRXhdg9gV1bjuog8SYGwhZekfV22',
          );
          expect(res.body.data.extrinsics.data[0].to_owner_normalized).toBe(
            '5C53RFCVKh9J6L7LEbYHA3CABJwRXiQeYKZNwanTALRDVkP622',
          );
          expect(res.body.data.extrinsics.data[0].hash).toBe(
            '0xb43c353f3745b5450dd76d29729721a7f91c023f1648872b448a71e179ca7c8b22',
          );
          expect(res.body.data.extrinsics.data[0].success).toBe(true);
          expect(res.body.data.extrinsics.data[0].timestamp).toBe(1639688886);
          expect(res.body.data.extrinsics.data[0].method).toBe('transfer');
          expect(res.body.data.extrinsics.data[0].section).toBe('balances');
          expect(res.body.data.extrinsics.data[0].amount).toBe(22);
          expect(res.body.data.extrinsics.data[0].fee).toBe(22);
        });
    });

    it('filter _or', async () => {
      const args = {
        where: {
          _or: [
            {
              from_owner: {
                _eq: 'yGGE6ussbUFLGG1MaLJ11JK8AbeM4TKKQsCPmEUGvVsWzdFGZ30',
              },
            },
            {
              block_number: {
                _eq: '12330515',
              },
            },
            {
              block_number: {
                _eq: '12330515156515',
              },
            },
          ],
        },
        order_by: {
          block_number: 'desc',
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.extrinsics.count).toBe(2);
          expect(res.body.data.extrinsics.data.length).toBe(2);

          expect(res.body.data.extrinsics.data[0].block_index).toBe(
            '123305-30',
          );
          expect(res.body.data.extrinsics.data[0].block_number).toBe(
            '12330530',
          );
          expect(res.body.data.extrinsics.data[0].from_owner).toBe(
            'yGGE6ussbUFLGG1MaLJ11JK8AbeM4TKKQsCPmEUGvVsWzdFGZ30',
          );

          expect(res.body.data.extrinsics.data[1].block_index).toBe(
            '123305-15',
          );
          expect(res.body.data.extrinsics.data[1].block_number).toBe(
            '12330515',
          );
          expect(res.body.data.extrinsics.data[1].from_owner).toBe(
            'yGGE6ussbUFLGG1MaLJ11JK8AbeM4TKKQsCPmEUGvVsWzdFGZ15',
          );
          expect(res.body.data.extrinsics.data[1].from_owner_normalized).toBe(
            '5FZJJ7YzbX8WxmwwLkbDwNkuFFeoqMF3on3LVvcqPGEeUAYo15',
          );
          expect(res.body.data.extrinsics.data[1].to_owner).toBe(
            'yGCjr31X6CRM3PZWyE8x4WyZRXhdg9gV1bjuog8SYGwhZekfV15',
          );
          expect(res.body.data.extrinsics.data[1].to_owner_normalized).toBe(
            '5C53RFCVKh9J6L7LEbYHA3CABJwRXiQeYKZNwanTALRDVkP615',
          );
          expect(res.body.data.extrinsics.data[1].hash).toBe(
            '0xb43c353f3745b5450dd76d29729721a7f91c023f1648872b448a71e179ca7c8b15',
          );
        });
    });
  });
});
