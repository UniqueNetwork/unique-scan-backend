import { Injectable, Logger } from '@nestjs/common';
import { Store } from '@subsquid/typeorm-store';
import { EventHandlerContext } from '@subsquid/substrate-processor';
import { Severity } from '@sentry/node';
import { AllBalances } from '@unique-nft/substrate-client/types';
import { EventName } from '@common/constants';
import { SdkService } from '../sdk/sdk.service';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { ProcessorService } from './processor/processor.service';
import { ISubscriberService } from './subscribers.service';
import { AccountService } from '../writers/account/account.service';
import { EventArgumentsService } from '../writers/event/event.arguments.service';

@Injectable()
export class AccountsSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(AccountsSubscriberService.name);

  constructor(
    private sdkService: SdkService,

    private accountWriterService: AccountService,

    @InjectSentry()
    private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(AccountsSubscriberService.name);
  }

  subscribe(processorService: ProcessorService) {
    [
      // System
      EventName.NEW_ACCOUNT,

      // Common
      EventName.COLLECTION_CREATED,
      EventName.ITEM_CREATED,
      EventName.ITEM_DESTROYED,
      EventName.TRANSFER,
      EventName.APPROVED,

      // Balances
      EventName.BALANCES_TRANSFER,
      EventName.BALANCES_WITHDRAW,
      EventName.BALANCES_DEPOSIT,
      EventName.BALANCES_ENDOWED,
      EventName.BALANCES_BALANCE_SET,
      EventName.BALANCES_RESERVED,
      EventName.BALANCES_UNRESERVED,

      // Unique
      EventName.COLLECTION_ADMIN_ADDED,
      EventName.COLLECTION_ADMIN_REMOVED,
      EventName.COLLECTION_OWNED_CHANGED,
      EventName.ALLOW_LIST_ADDRESS_ADDED,
      EventName.COLLECTION_SPONSOR_SET,
      EventName.SPONSORSHIP_CONFIRMED,
    ].forEach((eventName) =>
      processorService.processor.addEventHandler(
        eventName,
        this.upsertHandler.bind(this),
      ),
    );
  }

  /**
   * Gets balances data for every raw address value passed.
   */
  private getBalances(rawAddressValues: string[]): Promise<AllBalances[]> {
    return Promise.all(
      rawAddressValues.map((rawAddress) =>
        this.sdkService.getBalances(rawAddress),
      ),
    );
  }

  private async upsertHandler(ctx: EventHandlerContext<Store>): Promise<void> {
    const {
      block: { height: blockNumber, timestamp: blockTimestamp },
      event: { name: eventName, args },
    } = ctx;

    const log = {
      eventName,
      rawAddressValues: [],
      processedAccounts: [],
    };

    try {
      const rawAddressValues = EventArgumentsService.extractAddressValues(
        eventName,
        args,
      );
      log.rawAddressValues = rawAddressValues;

      if (!rawAddressValues.length) {
        throw new Error('No addresses found');
      }

      // Get balances and converted address from sdk
      const balancesData = await this.getBalances(rawAddressValues);

      await Promise.all(
        balancesData.map((balances, addressIndex) => {
          if (!balances) {
            this.logger.warn({
              message: 'No balances data',
              addressIndex,
              ...log,
            });
            this.sentry
              .instance()
              .captureMessage(
                `No balances data for block ${blockNumber}, event: "${eventName}", addressIndex: ${addressIndex}`,
                Severity.Warning,
              );
            return null;
          }

          log.processedAccounts.push(balances.address);

          return this.accountWriterService.upsert({
            blockNumber,
            blockTimestamp,
            balances,
          });
        }),
      );

      this.logger.verbose({ ...log });
    } catch (error) {
      this.logger.error({ ...log, error: error.message });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
