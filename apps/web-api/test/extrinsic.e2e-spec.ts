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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await fixtures.loadFixtures();

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

          expect(res.body.data.extrinsics.data[0].block_index).toBe(null);
        });
    });

    // it('should return one extrinsic', async () => {
    //   const args = {
    //     order_by: {
    //       block_number: 'desc',
    //     },
    //     limit: 1,
    //   };
    //
    //   return request(app.getHttpServer())
    //     .post(graphqlUrl)
    //     .send({ query, variables: { ...args } })
    //     .expect((res) => {
    //       expect(res.body.data.extrinsics.count).toBe(33);
    //       expect(res.body.data.extrinsics.data.length).toBe(1);
    //
    //       expect(res.body.data.extrinsics.data[0].block_index).toBe(null);
    //       expect(res.body.data.extrinsics.data[0].block_number).toBe('21382655');
    //       expect(res.body.data.extrinsics.data[0].amount).toBe(33);
    //     });
    // });

    // it('should return last extrinsic', async () => {
    //   const args = {
    //     order_by: {
    //       block_number: 'asc',
    //     },
    //     limit: 1,
    //   };
    //
    //   return request(app.getHttpServer())
    //     .post(graphqlUrl)
    //     .send({ query, variables: { ...args } })
    //     .expect((res) => {
    //       expect(res.body.data.extrinsics.count).toBe(33);
    //       expect(res.body.data.extrinsics.data.length).toBe(1);
    //
    //       expect(res.body.data.extrinsics.data[0].block_number).toBe('2138261');
    //     });
    // });

    // it('should return last page with data length 6', async () => {
    //   const args = {
    //     offset: 50,
    //   };
    //
    //   return request(app.getHttpServer())
    //     .post(graphqlUrl)
    //     .send({ query, variables: { ...args } })
    //     .expect((res) => {
    //       expect(res.body.data.extrinsics.count).toBe(33);
    //       expect(res.body.data.extrinsics.data.length).toBe(5);
    //     });
    // });

    // it('should return 0 extrinsic', async () => {
    //   const args = {
    //     where: {
    //       _and: [
    //         {
    //           block_number: {
    //             _eq: '12231',
    //           },
    //         },
    //         {
    //           block_index: {
    //             _eq: '2',
    //           },
    //         },
    //       ],
    //     },
    //   };
    //
    //   return request(app.getHttpServer())
    //     .post(graphqlUrl)
    //     .send({ query, variables: { ...args } })
    //     .expect((res) => {
    //       expect(res.body.data.extrinsics.count).toBe(0);
    //     });
    // });
  });
});
