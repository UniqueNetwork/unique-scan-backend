import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Fixtures } from '@common/test/loadFixtures';
import { AppModule } from '../src/app.module';

describe('Account (e2e)', () => {
  let app: INestApplication;
  const fixtures = new Fixtures();

  beforeEach(async () => {
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

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('New scan web API.');
  });
});
