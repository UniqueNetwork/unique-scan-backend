import { SubscriberName } from '@common/constants';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/config.module';
import { AccountsSubscriberService } from './accounts.subscriber.service';
import { BlocksSubscriberService } from './blocks.subscriber.service';

import { Client as PgClient } from 'pg';

export interface ISubscriberService {
  subscribe();
}

export const FORCE_RESCAN_BLOCK = 'force_rescan_block';

@Injectable()
export class SubscribersService {
  constructor(
    private configService: ConfigService<Config>,

    private accountsSubscriberService: AccountsSubscriberService,
    private blocksSubscriberService: BlocksSubscriberService,
  ) {}

  private logger = new Logger(SubscribersService.name);

  async listenPgEvents() {
    const config = {
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
    };

    const client = new PgClient(config);

    client.on('notification', async ({ channel, payload }) => {
      this.logger.log(`Received notification on channel ${channel}`);

      if (channel === FORCE_RESCAN_BLOCK && payload) {
        const blockNumber = parseInt(payload, 10);

        this.logger.log(`Force rescan called for block ${blockNumber} started`);
        await this.blocksSubscriberService.processBlockByNumber(blockNumber);
      }
    });

    await client.connect();
    await client.query(`LISTEN ${FORCE_RESCAN_BLOCK}`);
  }

  run() {
    const subscribersConfig = this.configService.get('subscribers');

    this.listenPgEvents();

    if (subscribersConfig[SubscriberName.BLOCKS]) {
      this.blocksSubscriberService.subscribe();
    }

    //return this.processorService.run(this.configService.get('rescan'));
  }
}
