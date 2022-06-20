import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { print } from 'graphql';
import * as request from 'supertest';
import { Fixtures } from '@common/test/fixtures';
import { gql } from 'apollo-server-express';
import { AppModule } from '../src/app.module';

describe('Block (e2e)', () => {
  let app: INestApplication;
  const fixtures = new Fixtures('apps/web-api/test/fixtures', 'block');
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

  describe('get list of block', () => {
    const query = print(
      gql`
        query getBlocks(
          $limit: Int
          $offset: Int
          $order_by: BlockOrderByParams
          $where: BlockWhereParams
        ) {
          block(
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

    it('should return list of blocks', async () => {
      const args = {
        order_by: {
          block_number: 'desc',
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.block.count).toBe(46);
          expect(res.body.data.block.data.length).toBe(10);

          expect(res.body.data.block.data[0].block_number).toBe(214569);
          expect(res.body.data.block.data[0].session_length).toBe(0);
          expect(res.body.data.block.data[0].spec_name).toBe('quartz');
          expect(res.body.data.block.data[0].spec_version).toBe(914000);
          expect(res.body.data.block.data[0].total_events).toBe(2);
          expect(res.body.data.block.data[0].num_transfers).toBe(0);
          expect(res.body.data.block.data[0].new_accounts).toBe(0);

          expect(res.body.data.block.data[0].timestamp).toBe(1640875392);
          expect(res.body.data.block.data[0].need_rescan).toBe(true);
          expect(res.body.data.block.data[0].total_extrinsics).toBe(2);

          expect(res.body.data.block.data[3].block_number).toBe(12393);
          expect(res.body.data.block.data[3].session_length).toBe(0);
          expect(res.body.data.block.data[3].spec_name).toBe('quartz');
          expect(res.body.data.block.data[3].spec_version).toBe(1);
          expect(res.body.data.block.data[3].total_events).toBe(2);
          expect(res.body.data.block.data[3].num_transfers).toBe(0);
          expect(res.body.data.block.data[3].new_accounts).toBe(0);
          expect(res.body.data.block.data[3].timestamp).toBe(1638217818);
          expect(res.body.data.block.data[3].need_rescan).toBe(true);
          expect(res.body.data.block.data[3].total_extrinsics).toBe(2);

          expect(res.body.data.block.data[7].block_number).toBe(12385);
          expect(res.body.data.block.data[7].session_length).toBe(0);
          expect(res.body.data.block.data[7].spec_name).toBe('quartz');
          expect(res.body.data.block.data[7].spec_version).toBe(1);
          expect(res.body.data.block.data[7].total_events).toBe(2);
          expect(res.body.data.block.data[7].num_transfers).toBe(0);
          expect(res.body.data.block.data[7].new_accounts).toBe(0);
          expect(res.body.data.block.data[7].timestamp).toBe(1638217722);
          expect(res.body.data.block.data[7].need_rescan).toBe(true);
          expect(res.body.data.block.data[7].total_extrinsics).toBe(2);
        });
    });

    it('should return one block', async () => {
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
          expect(res.body.data.block.count).toBe(46);
          expect(res.body.data.block.data.length).toBe(1);

          expect(res.body.data.block.data[0].block_number).toBe(214569);
          expect(res.body.data.block.data[0].session_length).toBe(0);
          expect(res.body.data.block.data[0].spec_name).toBe('quartz');
          expect(res.body.data.block.data[0].spec_version).toBe(914000);
          expect(res.body.data.block.data[0].total_events).toBe(2);
          expect(res.body.data.block.data[0].num_transfers).toBe(0);
          expect(res.body.data.block.data[0].new_accounts).toBe(0);
          expect(res.body.data.block.data[0].timestamp).toBe(1640875392);
          expect(res.body.data.block.data[0].need_rescan).toBe(true);
          expect(res.body.data.block.data[0].total_extrinsics).toBe(2);
        });
    });

    it('should return last block', async () => {
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
          expect(res.body.data.block.count).toBe(46);
          expect(res.body.data.block.data.length).toBe(1);

          expect(res.body.data.block.data[0].block_number).toBe(12222);
          expect(res.body.data.block.data[0].session_length).toBe(0);
          expect(res.body.data.block.data[0].spec_name).toBe('quartz');
          expect(res.body.data.block.data[0].spec_version).toBe(1);
          expect(res.body.data.block.data[0].total_events).toBe(2);
          expect(res.body.data.block.data[0].num_transfers).toBe(0);
          expect(res.body.data.block.data[0].new_accounts).toBe(0);
          expect(res.body.data.block.data[0].timestamp).toBe(1638215562);
          expect(res.body.data.block.data[0].need_rescan).toBe(true);
          expect(res.body.data.block.data[0].total_extrinsics).toBe(2);
        });
    });

    it('should return two block by id', async () => {
      const args = {
        order_by: {
          block_number: 'desc',
        },
        where: {
          _or: [
            {
              block_number: {
                _eq: 214569,
              },
            },
            {
              block_number: {
                _eq: 12385,
              },
            },
          ],
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.block.count).toBe(2);
          expect(res.body.data.block.data.length).toBe(2);

          expect(res.body.data.block.data[0].block_number).toBe(214569);
          expect(res.body.data.block.data[1].block_number).toBe(12385);
        });
    });

    it('should return last page with data length 6', async () => {
      const args = {
        offset: 40,
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.block.count).toBe(46);
          expect(res.body.data.block.data.length).toBe(6);
        });
    });

    it('should return block. _and filter', async () => {
      const args = {
        where: {
          _and: [
            {
              block_number: {
                _eq: 12231,
              },
            },
            {
              total_extrinsics: {
                _eq: 2,
              },
            },
          ],
        },
      };

      return request(app.getHttpServer())
        .post(graphqlUrl)
        .send({ query, variables: { ...args } })
        .expect((res) => {
          expect(res.body.data.block.count).toBe(1);

          expect(res.body.data.block.data[0].block_number).toBe(12231);
          expect(res.body.data.block.data[0].session_length).toBe(0);
          expect(res.body.data.block.data[0].spec_name).toBe('quartz');
          expect(res.body.data.block.data[0].spec_version).toBe(1);
          expect(res.body.data.block.data[0].total_events).toBe(2);
          expect(res.body.data.block.data[0].num_transfers).toBe(0);
          expect(res.body.data.block.data[0].new_accounts).toBe(0);
          expect(res.body.data.block.data[0].timestamp).toBe(1638215670);
          expect(res.body.data.block.data[0].need_rescan).toBe(true);
          expect(res.body.data.block.data[0].total_extrinsics).toBe(2);
        });
    });
  });
});
