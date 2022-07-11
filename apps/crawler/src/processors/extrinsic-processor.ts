import { Injectable, Logger } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ExtrinsicHandlerContext,
} from '@subsquid/substrate-processor';
import { Extrinsic } from '@entities/Extrinsic';
import { ExtrinsicNames } from '@common/constants';
import { ScanProcessor } from './scan-processor';
import { SdkService } from '../sdk.service';
import { UtilsService } from '@common/utils/utils.service';

@Injectable()
export class ExtrinsicProcessor extends ScanProcessor {
  private logger: Logger;

  constructor(
    @InjectRepository(Extrinsic)
    private modelRepository: Repository<Extrinsic>,
    private utils: UtilsService,
    protected connection: Connection,
    protected sdkService: SdkService,
  ) {
    super('extrinsic', connection, sdkService);

    this.logger = new Logger('ExtrinsicProcessor');

    Object.values(ExtrinsicNames).forEach((name) => {
      this.addExtrinsicHandler(name, async (ctx) => {
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

      if (data) {
        await this.modelRepository.upsert(data, ['block_number']);
      }

      this.logger.verbose({ ...log });
    } catch (err) {
      this.logger.error({ ...log, error: err.message });
    }
  }

  private getData(ctx: ExtrinsicHandlerContext) {
    const { block, extrinsic } = ctx;

    return {
      block_number: block.height,
      extrinsic_index: extrinsic.indexInBlock,
      is_signed: true,
      signer: extrinsic.signer,
      section: extrinsic.section,
      method: extrinsic.method,
      args: extrinsic.args,
      hash: extrinsic.hash,
      doc: extrinsic.era,
      success: true,
      timestamp: 12321,
      amount: 1,
      fee: 1,
      block_index: `${block.height}-${extrinsic.indexInBlock}`,
      to_owner: null,
      signer_normalized: null,
      to_owner_normalized: null,
    };
  }
}
