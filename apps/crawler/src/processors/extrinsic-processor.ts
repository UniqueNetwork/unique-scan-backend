import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtrinsicHandlerContext } from '@subsquid/substrate-processor';
import { Extrinsic } from '@entities/Extrinsic';
import { ExtrinsicNames, TransferMethods } from '@common/constants';
import { ScanProcessor } from './scan-processor';
import { SdkService } from '../sdk.service';
import { UtilsService } from '@common/utils/utils.service';
import { ProcessorConfigService } from '../processor.config.service';
import { Event } from '@entities/Event';

interface IExtrinsicOwner {
  value: { id?: string; substrate?: string; ethereum?: string };
}

@Injectable()
export class ExtrinsicProcessor {
  name = 'extrinsic';
  private logger: Logger;
  private processor: ScanProcessor;

  constructor(
    @InjectRepository(Extrinsic)
    private modelRepository: Repository<Extrinsic>,
    private utils: UtilsService,
    protected connection: Connection,
    protected sdkService: SdkService,
    private processorConfigService: ProcessorConfigService,
  ) {
    this.processor = new ScanProcessor(
      this.name,
      this.connection,
      processorConfigService.getDataSource(),
      processorConfigService.getRange(),
      processorConfigService.getTypesBundle(),
    );

    this.logger = new Logger('ExtrinsicProcessor');

    Object.values(ExtrinsicNames).forEach((name) => {
      this.processor.addExtrinsicHandler(name, async (ctx) => {
        await this.upsertHandler(ctx, name);
      });
    });

    this.logger.log('Starting processor...');
  }

  private async upsertHandler(
    ctx: ExtrinsicHandlerContext,
    eventName: string,
  ): Promise<void> {
    const { height, timestamp } = ctx.block;

    const log = {
      eventName,
      blockNumber: height,
      blockTimestamp: timestamp,
    };

    try {
      const data = await this.getData(ctx);
      await this.modelRepository.upsert(data, [
        'block_number',
        'extrinsic_index',
      ]);
      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }

  private async getData(ctx: ExtrinsicHandlerContext) {
    const { block, extrinsic } = ctx;
    const events = await this.getEvents(ctx);

    let to_owner: null | string = null;
    const methods = Object.values(TransferMethods) as string[];
    if (methods.includes(extrinsic.method)) {
      const args = extrinsic.args;
      const ownerData = args[0] as IExtrinsicOwner;
      if (ownerData) {
        to_owner =
          ownerData.value.id ||
          ownerData.value.substrate ||
          ownerData.value.ethereum ||
          null;
      }
    }

    return {
      block_number: block.height,
      extrinsic_index: extrinsic.indexInBlock,
      is_signed: !!extrinsic.signature,
      signer: extrinsic.signer,
      section: extrinsic.section,
      method: extrinsic.method,
      args: JSON.stringify(extrinsic.args),
      hash: extrinsic.hash,
      success: this.utils.getExtrinsicSuccess(events),
      timestamp: `${Math.floor(block.timestamp / 1000)}`,
      amount: String(this.utils.getExtrinsicAmount(events)),
      fee: String(this.utils.getExtrinsicFee(events)),
      block_index: `${block.height}-${extrinsic.indexInBlock}`,
      to_owner,
      signer_normalized: this.utils.normalizeSubstrateAddress(extrinsic.signer),
      to_owner_normalized: this.utils.normalizeSubstrateAddress(to_owner),
    };
  }

  private async getEvents(ctx: ExtrinsicHandlerContext) {
    const { block, extrinsic } = ctx;

    const chainEvents = await this.sdkService.getEvents(block.hash);
    const events: Event[] = [];

    for (const [, record] of Object.entries(chainEvents)) {
      const { event, phase } = record;

      if (!event) {
        continue;
      }

      const result = {
        section: event.section,
        method: event.method,
        phase: phase.toString(),
        data: JSON.stringify(event.data),
        amount: this.utils.parseAmount(event as Event),
      };

      try {
        const phaseParsed = JSON.parse(result.phase);
        if (
          phaseParsed &&
          phaseParsed.applyExtrinsic === extrinsic.indexInBlock
        ) {
          events.push(result as Event);
        }
      } catch {}
    }

    return events;
  }

  public run(): void {
    const params = this.processorConfigService.getAllParams();

    this.logger.log({
      msg: `Starting ${this.name} crawler...`,
      params,
    });

    this.processor.run();
  }
}
