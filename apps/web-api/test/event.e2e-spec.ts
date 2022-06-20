import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { print } from 'graphql';
import * as request from 'supertest';
import { Fixtures } from '@common/test/fixtures';
import { gql } from 'apollo-server-express';
import { AppModule } from '../src/app.module';

describe('Event (e2e)', () => {
  let app: INestApplication;
  const fixtures = new Fixtures('apps/web-api/test/fixtures', 'event');
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

  describe('get list of events', () => {
    const query = print(
      gql`
        query getEvents(
          $limit: Int
          $offset: Int
          $order_by: EventOrderByParams
          $where: EventWhereParams
        ) {
          events(
            limit: $limit
            offset: $offset
            order_by: $order_by
            where: $where
          ) {
            count
            data {
              block_index
              block_number
              amount
              fee
            }
          }
        }
      `,
    );

    it('should return list of events', async () => {
      const args = {
        order_by: {
          block_number: 'desc',
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.events.count).toBe(55);
          expect(res.body.data.events.data.length).toBe(10);

          expect(res.body.data.events.data[0].block_index).toBe(null);
          expect(res.body.data.events.data[0].block_number).toBe('21382655');
          expect(res.body.data.events.data[0].amount).toBe(55);

          expect(res.body.data.events.data[9].block_index).toBe(null);
          expect(res.body.data.events.data[9].block_number).toBe('21382646');
          expect(res.body.data.events.data[9].amount).toBe(46);
        });
    });

    it('should return one event', async () => {
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
          expect(res.body.data.events.count).toBe(55);
          expect(res.body.data.events.data.length).toBe(1);

          expect(res.body.data.events.data[0].block_index).toBe(null);
          expect(res.body.data.events.data[0].block_number).toBe('21382655');
          expect(res.body.data.events.data[0].amount).toBe(55);
        });
    });

    it('should return last event', async () => {
      const args = {
        order_by: {
          block_number: 'asc',
        },
        limit: 1,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.events.count).toBe(55);
          expect(res.body.data.events.data.length).toBe(1);

          expect(res.body.data.events.data[0].block_number).toBe('2138261');
        });
    });

    it('should return last page with data length 6', async () => {
      const args = {
        offset: 50,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.events.count).toBe(55);
          expect(res.body.data.events.data.length).toBe(5);
        });
    });

    it('should return 0 event', async () => {
      const args = {
        where: {
          _and: [
            {
              block_number: {
                _eq: '12231',
              },
            },
            {
              block_index: {
                _eq: '2',
              },
            },
          ],
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.events.count).toBe(0);
        });
    });
  });
});
