import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from './config.module';

export type Range = {
  from: number;
  to: number;
};

@Injectable()
export class ProcessorConfigService {
  constructor(private configService: ConfigService<Config>) {}

  public getDataSource() {
    return {
      archive: this.configService.get('archiveGqlUrl'),
      chain: this.configService.get('chainWsUrl'),
    };
  }

  public getRange(): Range {
    return {
      from: this.configService.get('scanRangeFrom'),
      to: this.configService.get('scanRangeTo'),
    };
  }

  public getTypesBundle(): string {
    return this.configService.get('scanTypesBundle');
  }

  public getAllParams(): {
    // dataSource: SubscquidDataSource;
    range: Range;
    typesBundle: string;
  } {
    return {
      //dataSource: this.getDataSource(),
      range: this.getRange(),
      typesBundle: this.getTypesBundle(),
    };
  }

  public isRescan() {
    return this.configService.get('rescan');
  }

  public getPrometheusPort(): number {
    return this.configService.get('prometheusPort');
  }

  public getBatchSize(): number {
    return this.configService.get('batchSize');
  }
}
