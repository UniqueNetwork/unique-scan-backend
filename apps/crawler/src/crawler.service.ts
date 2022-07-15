import { Injectable, Logger } from '@nestjs/common';
import { ProcessorConfigService } from './processor.config.service';
import { FooProcessor } from './processors/foo.processor';
import { ProcessorService } from './processors/processor.service';
import { Connection, DataSource } from 'typeorm';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private processorService: ProcessorService,
    private dataSource: DataSource,
    private fooProcessor: FooProcessor,
    private processorConfigService: ProcessorConfigService,
  ) {}

  async subscribeAll(forceRescan = false) {
    // const params = this.processorConfigService.getAllParams();

    this.processorService.processor.run();
  }
}
