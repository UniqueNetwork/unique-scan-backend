import { Inject, Injectable } from '@nestjs/common';
// import { Range } from '@subsquid/substrate-processor/lib/util/range';
import {
  SubstrateProcessor,
  EventHandlerContext,
  ExtrinsicHandlerContext,
} from '@subsquid/substrate-processor';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from './model';
import { Repository } from 'typeorm';
import { CollectionsProcessor } from './collections-processor';

@Injectable()
export class CrawlerService {

  constructor(
    private collectionsProcessor: CollectionsProcessor,
  ) {
    this.collectionsProcessor.addEventHandler(
      'system.ExtrinsicSuccess',
      this.commonEventHandler,
    );
  }

  getHello(): string {
    return 'Hello World!';
  }

  // vasync function treasuryBurnt(ctx: EventHandlerContext): Promise<void> {
  //     const event = new TreasuryBurntEvent(ctx);

  //     console.log('treasuryBurnt', event);
  //   }

  private commonEventHandler = async (ctx: EventHandlerContext): Promise<void> => {
    console.log('commonEventHandler');
    console.log(ctx.event);
  }

  private async commonExtrinsicHandler(
    ctx: ExtrinsicHandlerContext,
  ): Promise<void> {
    console.log('commonExtrinsicHandler');
    console.log(ctx.extrinsic);
  }

  subscribe() {
    this.collectionsProcessor.run();
  }

  // subscribe() {
  //   const processor = new SubstrateProcessor('subsquid_crawler');
  //   processor.setDataSource({
  //     archive: 'https://quartz.indexer.gc.subsquid.io/v4/graphql',
  //     // archive: 'https://quartz.subsquid.fatcat.ventures/v1/graphql',
  //     chain: 'wss://ws-quartz.unique.network',
  //   });
  //   processor.setBlockRange({ from: 1000000 });
  //   processor.setTypesBundle('quartz');
  //
  //   // processor.addEventHandler('system.ExtrinsicSuccess', systemExtrinsicSuccess);
  //   processor.addEventHandler('treasury.Burnt', this.commonEventHandler);
  //
  //   processor.addExtrinsicHandler(
  //     'unique.createCollectionEx',
  //     this.commonExtrinsicHandler,
  //   );
  //
  //   processor.run();
  // }

  // rescanBlockRange(range: Range) {}
}
