import { Injectable, Scope } from '@nestjs/common';
import { SubscribersService } from './subscribers/subscribers.service';

@Injectable()
export class CrawlerService {
  constructor(private subscribersService: SubscribersService) {}

  async run() {
    return this.subscribersService.run();
  }
}
