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
        const blockNumbers = payload
          .split(',')
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n));

        this.logger.log(
          `Going to force rescan blocks: ${blockNumbers.join(', ')}`,
        );

        for (const blockNumber of blockNumbers) {
          this.logger.log(`Rescan for block ${blockNumber}`);

          await this.blocksSubscriberService.processBlockByNumber(blockNumber);

          this.logger.log(`Rescan for block ${blockNumber} finished`);
        }
      }
    });

    await client.connect();
    await client.query(`LISTEN ${FORCE_RESCAN_BLOCK}`);
    this.logger.log(
      `Listening for notifications on channel ${FORCE_RESCAN_BLOCK}`,
    );
  }

  async run() {
    const subscribersConfig = this.configService.get('subscribers');

    if (subscribersConfig[SubscriberName.BLOCKS]) {
      this.blocksSubscriberService
        .subscribe()
        .then(() => this.logger.log('subscribe() resolved'));
    }

    await this.listenPgEvents();

    //return this.processorService.run(this.configService.get('rescan'));
  }
}
