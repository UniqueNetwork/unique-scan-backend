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
import { AccountWriterService } from '../writers/account.writer.service';
import { EventWriterService } from '../writers/event.writer.service';

@Injectable()
export class AccountsSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(AccountsSubscriberService.name);

  constructor(
    private sdkService: SdkService,

    private accountWriterService: AccountWriterService,

    @InjectSentry()
    private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(AccountsSubscriberService.name);
  }

  subscribe(processorService: ProcessorService) {
    [
      EventName.NEW_ACCOUNT,
      EventName.COLLECTION_CREATED,
      EventName.ITEM_CREATED,
      EventName.COLLECTION_ADMIN_ADDED,
      EventName.COLLECTION_OWNED_CHANGED,
      EventName.TRANSFER,
      EventName.BALANCES_DEPOSIT,
      EventName.BALANCES_ENDOWED,
      EventName.BALANCES_WITHDRAW,
      EventName.BALANCES_TRANSFER,
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
      const rawAddressValues = EventWriterService.extractAddressValues(
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
