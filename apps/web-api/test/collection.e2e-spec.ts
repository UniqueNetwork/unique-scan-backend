import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { print } from 'graphql';
import * as request from 'supertest';
import { Fixtures } from '@common/test/fixtures';
import { gql } from 'apollo-server-express';
import { AppModule } from '../src/app.module';

describe('Collections (e2e)', () => {
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

  describe('get list of collections', () => {
    const query = print(
      gql`
        query getCollections(
          $limit: Int
          $offset: Int
          $order_by: CollectionOrderByParams
          $where: CollectionWhereParamsWithRelation
        ) {
          collections(
            limit: $limit
            offset: $offset
            order_by: $order_by
            where: $where
          ) {
            count
            data {
              collection_id
              owner
              owner_normalized
              name
              description
              offchain_schema
              token_limit
              token_prefix
              collection_cover
              type
              mint_mode
              limits_account_ownership
              limits_sponsore_data_size
              limits_sponsore_data_rate
              owner_can_transfer
              owner_can_destroy
              schema_version
              sponsorship
              const_chain_schema
              tokens_count
              holders_count
              actions_count
              date_of_creation
              variable_on_chain_schema
              tokens {
                collection_cover
                collection_description
                collection_id
                collection_name
                data
                token_id
                token_prefix
                owner
                owner_normalized
              }
            }
          }
        }
      `,
    );

    it('should return list of collections with tokens', async () => {
      const args = {
        order_by: {
          collection_id: 'desc',
        },
        limit: 5,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.collections.count).toBe(50);
          expect(res.body.data.collections.data.length).toBe(5);

          expect(res.body.data.collections.data[0].collection_id).toBe(50);
          expect(res.body.data.collections.data[0].owner).toBe(
            'yGDeWpLr1eyQYfni8f9tJKFujUrG6SABqieGukBy8GsDurzcr',
          );
          expect(res.body.data.collections.data[0].owner_normalized).toBe(
            '5CyiCaXQnFCoNZJVfcUWxKYU8TZqpC7UfDvV1eK3AFwZi5VL',
          );
          expect(res.body.data.collections.data[0].name).toBe('50');
          expect(res.body.data.collections.data[0].description).toBe('50');
          expect(res.body.data.collections.data[0].offchain_schema).toBe('50');
          expect(res.body.data.collections.data[0].schema_version).toBe(
            'ImageURL50',
          );
          expect(res.body.data.collections.data[0].tokens_count).toBe(950);
          expect(res.body.data.collections.data[0].holders_count).toBe(750);
          expect(res.body.data.collections.data[0].actions_count).toBe(1450);
          expect(res.body.data.collections.data[0].date_of_creation).toBe(
            1650354798,
          );
          expect(
            res.body.data.collections.data[0].tokens[0].collection_cover,
          ).toBe('collection_cover_50');
          expect(
            res.body.data.collections.data[0].tokens[0].collection_description,
          ).toBe('50');
          expect(
            res.body.data.collections.data[0].tokens[0].collection_id,
          ).toBe(50);
          expect(
            res.body.data.collections.data[0].tokens[0].collection_name,
          ).toBe('50');
          expect(res.body.data.collections.data[0].tokens[0].token_id).toBe(50);
          expect(res.body.data.collections.data[0].tokens[0].token_prefix).toBe(
            'testSTa50',
          );
          expect(res.body.data.collections.data[0].tokens[0].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b50',
          );
          expect(
            res.body.data.collections.data[0].tokens[0].owner_normalized,
          ).toBe('0x2303410dcc766995e70b47beedda828b4486320b50');

          expect(res.body.data.collections.data[3].collection_id).toBe(47);
          expect(res.body.data.collections.data[3].owner).toBe(
            'yGDeWpLr1eyQYfni8f9tJKFujUrG6SABqieGukBy8GsDurzcr',
          );
          expect(res.body.data.collections.data[3].owner_normalized).toBe(
            '5CyiCaXQnFCoNZJVfcUWxKYU8TZqpC7UfDvV1eK3AFwZi5VL',
          );
          expect(res.body.data.collections.data[3].name).toBe('47');
          expect(res.body.data.collections.data[3].description).toBe('47');
          expect(res.body.data.collections.data[3].offchain_schema).toBe('47');
          expect(res.body.data.collections.data[3].token_limit).toBe(0);
          expect(res.body.data.collections.data[3].token_prefix).toBe(
            'testSTa47',
          );
          expect(res.body.data.collections.data[3].collection_cover).toBe(
            'collection_cover_47',
          );
          expect(res.body.data.collections.data[3].type).toBe('mode_47');
          expect(res.body.data.collections.data[3].mint_mode).toBe(false);
          expect(res.body.data.collections.data[3].schema_version).toBe(
            'ImageURL47',
          );
          expect(res.body.data.collections.data[3].sponsorship).toBe(null);
          expect(res.body.data.collections.data[3].tokens_count).toBe(947);
          expect(res.body.data.collections.data[3].holders_count).toBe(747);
          expect(res.body.data.collections.data[3].actions_count).toBe(1447);
          expect(res.body.data.collections.data[3].date_of_creation).toBe(
            1650354798,
          );
          expect(
            res.body.data.collections.data[3].tokens[0].collection_cover,
          ).toBe('collection_cover_47');
          expect(
            res.body.data.collections.data[3].tokens[0].collection_description,
          ).toBe('47');
          expect(
            res.body.data.collections.data[3].tokens[0].collection_id,
          ).toBe(47);
          expect(
            res.body.data.collections.data[3].tokens[0].collection_name,
          ).toBe('47');
          expect(res.body.data.collections.data[3].tokens[0].token_id).toBe(47);
          expect(res.body.data.collections.data[3].tokens[0].token_prefix).toBe(
            'testSTa47',
          );
          expect(res.body.data.collections.data[3].tokens[0].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b47',
          );
          expect(
            res.body.data.collections.data[3].tokens[0].owner_normalized,
          ).toBe('0x2303410dcc766995e70b47beedda828b4486320b47');
        });
    });

    it('filter by tokens', async () => {
      const args = {
        where: {
          tokens: {
            owner: {
              _eq: '0x2303410dcc766995e70b47beedda828b4486320b25',
            },
          },
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.collections.count).toBe(1);
          expect(res.body.data.collections.data.length).toBe(1);

          expect(res.body.data.collections.data[0].collection_id).toBe(25);
          expect(res.body.data.collections.data[0].owner).toBe(
            'yGDeWpLr1eyQYfni8f9tJKFujUrG6SABqieGukBy8GsDurzcr',
          );
          expect(res.body.data.collections.data[0].owner_normalized).toBe(
            '5CyiCaXQnFCoNZJVfcUWxKYU8TZqpC7UfDvV1eK3AFwZi5VL',
          );
          expect(res.body.data.collections.data[0].description).toBe('25');
          expect(res.body.data.collections.data[0].offchain_schema).toBe('25');
          expect(res.body.data.collections.data[0].token_prefix).toBe(
            'testSTa25',
          );
          expect(res.body.data.collections.data[0].collection_cover).toBe(
            'collection_cover_25',
          );
          expect(res.body.data.collections.data[0].type).toBe('mode_25');
          expect(res.body.data.collections.data[0].schema_version).toBe(
            'ImageURL25',
          );
          expect(res.body.data.collections.data[0].tokens_count).toBe(925);
          expect(res.body.data.collections.data[0].holders_count).toBe(725);
          expect(res.body.data.collections.data[0].actions_count).toBe(1425);
          expect(res.body.data.collections.data[0].date_of_creation).toBe(
            1650354798,
          );
          expect(
            res.body.data.collections.data[0].tokens[0].collection_cover,
          ).toBe('collection_cover_25');
          expect(
            res.body.data.collections.data[0].tokens[0].collection_description,
          ).toBe('25');
          expect(
            res.body.data.collections.data[0].tokens[0].collection_id,
          ).toBe(25);
          expect(res.body.data.collections.data[0].tokens[0].token_prefix).toBe(
            'testSTa25',
          );
          expect(res.body.data.collections.data[0].tokens[0].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b25',
          );
          expect(
            res.body.data.collections.data[0].tokens[0].owner_normalized,
          ).toBe('0x2303410dcc766995e70b47beedda828b4486320b25');
        });
    });

    it('filter by tokens + _or and order_by collection_id', async () => {
      const args = {
        order_by: {
          collection_id: 'asc',
        },
        where: {
          tokens: {
            _or: [
              {
                owner: {
                  _eq: '0x2303410dcc766995e70b47beedda828b4486320b25',
                },
              },
              {
                collection_id: {
                  _eq: 1,
                },
              },
            ],
          },
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.collections.count).toBe(2);
          expect(res.body.data.collections.data.length).toBe(2);

          expect(res.body.data.collections.data[0].collection_id).toBe(1);
          expect(res.body.data.collections.data[0].owner).toBe(
            'yGDeWpLr1eyQYfni8f9tJKFujUrG6SABqieGukBy8GsDurzcr',
          );
          expect(res.body.data.collections.data[0].owner_normalized).toBe(
            '5CyiCaXQnFCoNZJVfcUWxKYU8TZqpC7UfDvV1eK3AFwZi5VL',
          );

          expect(
            res.body.data.collections.data[0].tokens[0].collection_cover,
          ).toBe('collection_cover_1');
          expect(
            res.body.data.collections.data[0].tokens[0].collection_description,
          ).toBe('1');
          expect(
            res.body.data.collections.data[0].tokens[0].collection_id,
          ).toBe(1);
          expect(
            res.body.data.collections.data[0].tokens[0].collection_name,
          ).toBe('1');
          expect(res.body.data.collections.data[0].tokens[0].token_id).toBe(1);
          expect(res.body.data.collections.data[0].tokens[0].token_prefix).toBe(
            'testSTa1',
          );
          expect(res.body.data.collections.data[0].tokens[0].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b1',
          );
          expect(
            res.body.data.collections.data[0].tokens[0].owner_normalized,
          ).toBe('0x2303410dcc766995e70b47beedda828b4486320b1');

          expect(res.body.data.collections.data[1].collection_id).toBe(25);
          expect(res.body.data.collections.data[1].owner).toBe(
            'yGDeWpLr1eyQYfni8f9tJKFujUrG6SABqieGukBy8GsDurzcr',
          );
          expect(res.body.data.collections.data[1].owner_normalized).toBe(
            '5CyiCaXQnFCoNZJVfcUWxKYU8TZqpC7UfDvV1eK3AFwZi5VL',
          );
          expect(res.body.data.collections.data[1].description).toBe('25');
          expect(res.body.data.collections.data[1].offchain_schema).toBe('25');
          expect(res.body.data.collections.data[1].token_prefix).toBe(
            'testSTa25',
          );
          expect(res.body.data.collections.data[1].collection_cover).toBe(
            'collection_cover_25',
          );
          expect(res.body.data.collections.data[1].type).toBe('mode_25');
          expect(res.body.data.collections.data[1].schema_version).toBe(
            'ImageURL25',
          );
          expect(res.body.data.collections.data[1].tokens_count).toBe(925);
          expect(res.body.data.collections.data[1].holders_count).toBe(725);
          expect(res.body.data.collections.data[1].actions_count).toBe(1425);
          expect(res.body.data.collections.data[1].date_of_creation).toBe(
            1650354798,
          );
          expect(
            res.body.data.collections.data[1].tokens[0].collection_cover,
          ).toBe('collection_cover_25');
          expect(
            res.body.data.collections.data[1].tokens[0].collection_description,
          ).toBe('25');
          expect(
            res.body.data.collections.data[1].tokens[0].collection_id,
          ).toBe(25);
          expect(res.body.data.collections.data[1].tokens[0].token_prefix).toBe(
            'testSTa25',
          );
          expect(res.body.data.collections.data[1].tokens[0].owner).toBe(
            '0x2303410dcc766995e70b47beedda828b4486320b25',
          );
          expect(
            res.body.data.collections.data[1].tokens[0].owner_normalized,
          ).toBe('0x2303410dcc766995e70b47beedda828b4486320b25');
        });
    });
  });
});
