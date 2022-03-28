import { Controller, Get } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller()
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Get()
  getHello(): string {
    return this.scraperService.getHello();
  }
}
