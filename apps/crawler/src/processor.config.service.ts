import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource as SubscquidDataSource } from '@subsquid/substrate-processor';
import { Range } from '@subsquid/substrate-processor/lib/util/range';

@Injectable()
export class ProcessorConfigService {
  constructor(private configService: ConfigService) {}

  public getDataSource(): SubscquidDataSource {
    return {
      archive: this.configService.get('ARCHIVE_GQL_URL'),
      chain: this.configService.get('CHAIN_WS_URL'),
    };
  }

  public getRange(): Range {
    const to = this.configService.get('SCAN_RANGE_TO');
    return {
      from: this.configService.get('SCAN_RANGE_FROM', 0),
      to,
    };
  }

  public getTypesBundle(): string {
    return this.configService.get('SCAN_TYPES_BUNDLE');
  }

  public getAllParams(): {
    dataSource: SubscquidDataSource;
    range: Range;
    typesBundle: string;
  } {
    return {
      dataSource: this.getDataSource(),
      range: this.getRange(),
      typesBundle: this.getTypesBundle(),
    };
  }

  public getForceMode() {
    return this.configService.get('SCAN_FORCE_RESCAN');
  }

  public getPrometheusPort(): number {
    return this.configService.get('PROMETHEUS_PORT', 9090);
  }
}
