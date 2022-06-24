import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { print } from 'graphql';
import * as request from 'supertest';
import { Fixtures } from '@common/test/fixtures';
import { gql } from 'apollo-server-express';
import { AppModule } from '../src/app.module';

describe('Holders (e2e)', () => {
  let app: INestApplication;
  const fixtures = new Fixtures(
    'apps/web-api/test/fixtures',
    'collections|collections_stats|tokens',
  );
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

  describe('get list of holders', () => {
    const query = print(
      gql`
        query getHolders(
          $limit: Int
          $offset: Int
          $order_by: HolderOrderByParams
          $where: HolderWhereParams
        ) {
          holders(
            limit: $limit
            offset: $offset
            order_by: $order_by
            where: $where
          ) {
            count
            data {
              count
              owner
              owner_normalized
              collection_id
            }
          }
        }
      `,
    );

    it('should return list of holders', async () => {
      const args = {
        order_by: {
          collection_id: 'desc',
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.holders.count).toBe(50);
          expect(res.body.data.holders.data.length).toBe(10);

          expect(res.body.data.holders.data[0].count).toBe(1);
          expect(res.body.data.holders.data[0].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b50',
          );
          expect(res.body.data.holders.data[0].owner_normalized).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b50',
          );
          expect(res.body.data.holders.data[0].collection_id).toBe(50);

          expect(res.body.data.holders.data[5].count).toBe(1);
          expect(res.body.data.holders.data[5].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b45',
          );
          expect(res.body.data.holders.data[5].owner_normalized).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b45',
          );
          expect(res.body.data.holders.data[5].collection_id).toBe(45);
        });
    });

    it('should return list of holders', async () => {
      const args = {
        order_by: {
          collection_id: 'desc',
        },
        where: {
          _or: [
            {
              collection_id: { _eq: 8 },
            },
            {
              collection_id: { _eq: 15 },
            },
          ],
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.holders.count).toBe(2);
          expect(res.body.data.holders.data.length).toBe(2);

          expect(res.body.data.holders.data[0].count).toBe(1);
          expect(res.body.data.holders.data[0].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b15',
          );
          expect(res.body.data.holders.data[0].owner_normalized).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b15',
          );
          expect(res.body.data.holders.data[0].collection_id).toBe(15);

          expect(res.body.data.holders.data[1].count).toBe(1);
          expect(res.body.data.holders.data[1].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b8',
          );
          expect(res.body.data.holders.data[1].owner_normalized).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b8',
          );
          expect(res.body.data.holders.data[1].collection_id).toBe(8);
        });
    });
  });
});
