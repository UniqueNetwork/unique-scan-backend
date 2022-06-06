import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Account } from '@entities/Account';
import { AccountService } from '../src/account/account.service';

describe('AccountService', () => {
  let accountService: AccountService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useValue: {},
        },
      ],
    }).compile();

    accountService = app.get<AccountService>(AccountService);
  });

  describe('root', () => {
    it('should be defined', async () => {
      expect(accountService).toBeDefined();
    });
  });
});
