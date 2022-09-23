import { Injectable, Logger } from '@nestjs/common';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { EventName } from '@common/constants';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { ProcessorService } from './processor/processor.service';
import { ISubscriberService } from './subscribers.service';
import { EventService } from '../writers/event/event.service';

@Injectable()
export class AccountsSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(AccountsSubscriberService.name);

  constructor(
    private eventService: EventService,

    @InjectSentry()
    private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(AccountsSubscriberService.name);
  }

  subscribe(processorService: ProcessorService) {
    [
      // Balances
      EventName.BALANCES_BALANCE_SET,
      EventName.BALANCES_DEPOSIT,
      EventName.BALANCES_DUST_LOST,
      EventName.BALANCES_ENDOWED,
      EventName.BALANCES_RESERVED,
      EventName.BALANCES_RESERVED_REPATRIATED,
      EventName.BALANCES_SLASHED,
      EventName.BALANCES_TRANSFER,
      EventName.BALANCES_UNRESERVED,
      EventName.BALANCES_WITHDRAW,

      // Common
      EventName.APPROVED,
      EventName.COLLECTION_CREATED,
      EventName.ITEM_CREATED,
      EventName.ITEM_DESTROYED,
      EventName.TRANSFER,

      // System
      EventName.NEW_ACCOUNT,

      // Unique
      EventName.ALLOW_LIST_ADDRESS_ADDED,
      EventName.ALLOW_LIST_ADDRESS_REMOVED,
      EventName.COLLECTION_ADMIN_ADDED,
      EventName.COLLECTION_ADMIN_REMOVED,
      EventName.COLLECTION_OWNED_CHANGED,
      EventName.COLLECTION_SPONSOR_SET,
      EventName.COLLECTION_SPONSOR_REMOVED,
      EventName.SPONSORSHIP_CONFIRMED,
    ].forEach((eventName) =>
      processorService.processor.addEventHandler(
        eventName,
        this.upsertHandler.bind(this),
      ),
    );
  }

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      event: { name: eventName, args: rawArgs },
    } = ctx;

    const log = {
      eventName,
      processedAccounts: [],
    };

    try {
      const accountIds = await this.eventService.processEventWithAccounts(
        eventName,
        rawArgs,
      );

      log.processedAccounts = accountIds;

      this.logger.verbose({ ...log });
    } catch (error) {
      this.logger.error({ ...log, error: error.message });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
