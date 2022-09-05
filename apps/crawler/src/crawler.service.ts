import { Injectable } from '@nestjs/common';
import { SubscribersService } from './subscribers/subscribers.service';

@Injectable()
export class CrawlerService {
  constructor(private subscribersService: SubscribersService) {}

  run() {
    return this.subscribersService.run();
  }
}
