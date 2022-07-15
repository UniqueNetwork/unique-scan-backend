import { Injectable, Logger } from '@nestjs/common';
import { SdkService } from '../sdk.service';
import { ProcessorConfigService } from '../processor.config.service';
import { ProcessorService } from './processor.service';

@Injectable()
export class FooProcessor {
  name = 'foo';
  private readonly logger = new Logger(FooProcessor.name);

  constructor(
    private processorService: ProcessorService,
    protected sdkService: SdkService,
  ) {
    console.log('FooProcessor constructor');

    this.processorService.processor.addEventHandler(
      'Common.CollectionCreated',
      async (ctx) => {
        console.log(ctx);
      },
    );
  }
}
