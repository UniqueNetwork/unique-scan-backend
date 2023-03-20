import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthService } from '../health';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  check() {
    return this.health.check();
  }
}
