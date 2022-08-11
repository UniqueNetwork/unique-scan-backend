import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { print } from 'graphql';
import * as request from 'supertest';
import { Fixtures } from '@common/test/fixtures';
import { gql } from 'apollo-server-express';
import { AppModule } from '../src/app.module';

describe('Tokens (e2e)', () => {
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

  describe('get list of tokens', () => {
    const query = print(
      gql`
        query getTokens(
          $limit: Int
          $offset: Int
          $where: TokenWhereParams = {}
          $order_by: TokenOrderByParams = {}
        ) {
          tokens(
            where: $where
            limit: $limit
            offset: $offset
            order_by: $order_by
          ) {
            count
            data {
              collection {
                collection_id
                date_of_creation
                description
                holders_count
                name
                owner
              }
              collection_cover
              collection_description
              collection_id
              collection_name
              image
              date_of_creation
              owner
              owner_normalized
              token_id
              token_name
              token_prefix
              parent_id
              is_sold
            }
          }
        }
      `,
    );

    it('should return list of tokens with collection', async () => {
      const args = {
        orderBy: {
          token_id: 'desc',
        },
        limit: 5,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.tokens.count).toBe(50);
          expect(res.body.data.tokens.data.length).toBe(5);

          expect(res.body.data.tokens.data[0].collection.collection_id).toBe(1);
          expect(res.body.data.tokens.data[0].collection.date_of_creation).toBe(
            1650354798,
          );
          expect(res.body.data.tokens.data[0].collection.description).toBe('1');
          expect(res.body.data.tokens.data[0].collection.holders_count).toBe(
            71,
          );
          expect(res.body.data.tokens.data[0].collection.name).toBe('1');
          expect(res.body.data.tokens.data[0].collection.owner).toBe(
            'yGDeWpLr1eyQYfni8f9tJKFujUrG6SABqieGukBy8GsDurzcr',
          );
          expect(res.body.data.tokens.data[0].collection_cover).toBe(
            'collection_cover_1',
          );
          expect(res.body.data.tokens.data[0].collection_description).toBe('1');
          expect(res.body.data.tokens.data[0].collection_id).toBe(1);
          expect(res.body.data.tokens.data[0].collection_name).toBe('1');
          expect(res.body.data.tokens.data[0].date_of_creation).toBe(
            1650433764,
          );

          // todo: check me, maybe add 'attributes' and 'properties'
          expect(res.body.data.tokens.data[0].image).toBe('1');

          expect(res.body.data.tokens.data[0].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b1',
          );
          expect(res.body.data.tokens.data[0].owner_normalized).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b1',
          );
          expect(res.body.data.tokens.data[0].token_id).toBe(1);
          expect(res.body.data.tokens.data[0].token_name).toBe('testSTa1 #1');
          expect(res.body.data.tokens.data[0].token_prefix).toBe('testSTa1');

          expect(res.body.data.tokens.data[3].collection.collection_id).toBe(4);
          expect(res.body.data.tokens.data[3].collection.date_of_creation).toBe(
            1650354798,
          );
          expect(res.body.data.tokens.data[3].collection.description).toBe('4');
          expect(res.body.data.tokens.data[3].collection.holders_count).toBe(
            74,
          );
          expect(res.body.data.tokens.data[3].collection.name).toBe('4');
          expect(res.body.data.tokens.data[3].collection.owner).toBe(
            'yGDeWpLr1eyQYfni8f9tJKFujUrG6SABqieGukBy8GsDurzcr',
          );
          expect(res.body.data.tokens.data[3].collection_cover).toBe(
            'collection_cover_4',
          );
          expect(res.body.data.tokens.data[3].collection_description).toBe('4');
          expect(res.body.data.tokens.data[3].collection_id).toBe(4);
          expect(res.body.data.tokens.data[3].collection_name).toBe('4');
          expect(res.body.data.tokens.data[3].date_of_creation).toBe(
            1650433764,
          );

          // todo: check me, maybe add 'attributes' and 'properties'
          expect(res.body.data.tokens.data[3].image).toBe('4');

          expect(res.body.data.tokens.data[3].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b4',
          );
          expect(res.body.data.tokens.data[3].owner_normalized).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b4',
          );
          expect(res.body.data.tokens.data[3].token_id).toBe(4);
          expect(res.body.data.tokens.data[3].token_name).toBe('testSTa4 #4');
          expect(res.body.data.tokens.data[3].token_prefix).toBe('testSTa4');
        });
    });

    it('page 2 limit 7', async () => {
      const args = {
        limit: 7,
        offset: 10,
        orderBy: {
          token_id: 'desc',
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.tokens.count).toBe(50);
          expect(res.body.data.tokens.data.length).toBe(7);

          expect(res.body.data.tokens.data[0].token_id).toBe(11);
          expect(res.body.data.tokens.data[6].token_id).toBe(17);
        });
    });

    it('page 1 limit 10 + _or', async () => {
      const args = {
        limit: 10,
        orderBy: {
          token_id: 'desc',
        },
        where: {
          _or: [
            {
              token_id: {
                _eq: 1,
              },
            },
            {
              token_id: {
                _eq: 2,
              },
            },
            {
              collection_name: {
                _ilike: '9',
              },
            },
            {
              token_prefix: {
                _eq: 'token_prefix_7',
              },
            },
          ],
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.tokens.count).toBe(3);
          expect(res.body.data.tokens.data.length).toBe(3);

          expect(res.body.data.tokens.data[0].token_id).toBe(1);
          expect(res.body.data.tokens.data[1].token_id).toBe(2);
          expect(res.body.data.tokens.data[2].token_id).toBe(9);
        });
    });

    it('fiter by parent_id', async () => {
      const args = {
        limit: 10,
        orderBy: {
          token_id: 'desc',
        },
        where: {
          parent_id: { _eq: '46_46' },
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.tokens.count).toBe(3);
          expect(res.body.data.tokens.data.length).toBe(3);

          expect(res.body.data.tokens.data[0].token_id).toBe(47);
          expect(res.body.data.tokens.data[0].parent_id).toBe('46_46');
          expect(res.body.data.tokens.data[1].token_id).toBe(48);
          expect(res.body.data.tokens.data[1].parent_id).toBe('46_46');
          expect(res.body.data.tokens.data[2].token_id).toBe(49);
          expect(res.body.data.tokens.data[2].parent_id).toBe('46_46');
        });
    });

    it('fiter by parent_id', async () => {
      const args = {
        limit: 10,
        orderBy: {
          token_id: 'desc',
        },
        where: {
          parent_id: { _ilike: '4%' },
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.tokens.count).toBe(4);
          expect(res.body.data.tokens.data.length).toBe(4);

          expect(res.body.data.tokens.data[0].token_id).toBe(47);
          expect(res.body.data.tokens.data[0].parent_id).toBe('46_46');
          expect(res.body.data.tokens.data[1].token_id).toBe(48);
          expect(res.body.data.tokens.data[1].parent_id).toBe('46_46');
          expect(res.body.data.tokens.data[2].token_id).toBe(49);
          expect(res.body.data.tokens.data[2].parent_id).toBe('46_46');
          expect(res.body.data.tokens.data[3].token_id).toBe(50);
          expect(res.body.data.tokens.data[3].parent_id).toBe('47_47');
        });
    });
  });
});
