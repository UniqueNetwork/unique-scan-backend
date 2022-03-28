import { Injectable } from '@nestjs/common';

@Injectable()
export class ScraperService {
  getHello(): string {
    return 'Hello World!';
  }
}
