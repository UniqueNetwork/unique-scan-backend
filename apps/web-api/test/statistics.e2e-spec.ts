import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { print } from 'graphql';
import * as request from 'supertest';
import { Fixtures } from '@common/test/fixtures';
import { gql } from 'apollo-server-express';
import { AppModule } from '../src/app.module';

describe('Statistics (e2e)', () => {
  let app: INestApplication;
  const fixtures = new Fixtures('apps/web-api/test/fixtures', 'total');
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

  describe('get statistics records', () => {
    const totalCount = 6;

    const query = print(
      gql`
        query getStatistics(
          $limit: Int
          $offset: Int
          $order_by: StatisticsOrderByParams
          $where: StatisticsWhereParams
        ) {
          statistics(
            limit: $limit
            offset: $offset
            order_by: $order_by
            where: $where
          ) {
            count
            data {
              name
              count
            }
          }
        }
      `,
    );

    it('should return list of records', async () => {
      const args = {
        order_by: {
          count: 'desc',
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          const { count, data } = res.body.data.statistics;

          expect(count).toBe(totalCount);
          expect(data.length).toBe(totalCount);

          expect(data[0].name).toBe('events');
          expect(data[0].count).toBe(600000);
        });
    });

    it('should return one record', async () => {
      const args = {
        order_by: {
          count: 'asc',
        },
        limit: 1,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          const { count, data } = res.body.data.statistics;

          expect(count).toBe(totalCount);
          expect(data.length).toBe(1);

          expect(data[0].name).toBe('collections');
          expect(data[0].count).toBe(150);
        });
    });

    it('check for offset', async () => {
      const args = {
        offset: 3,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          const { count, data } = res.body.data.statistics;

          expect(count).toBe(totalCount);
          expect(data.length).toBe(3);
        });
    });

    it('no data response', async () => {
      const args = {
        where: {
          _and: [
            {
              name: {
                _eq: 'no_such_metrics',
              },
            },
          ],
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.statistics.count).toBe(0);
        });
    });
  });
});
