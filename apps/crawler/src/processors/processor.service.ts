import { Injectable, Logger } from '@nestjs/common';
import {
  SubstrateProcessor,
  SubstrateBatchProcessor,
} from '@subsquid/substrate-processor';
import {
  FullTypeormDatabase,
  TypeormDatabase,
  Store,
} from '@subsquid/typeorm-store';
import { DataSource, Db } from 'typeorm';

@Injectable()
export class ProcessorService {
  public processor: SubstrateProcessor<Store>;

  constructor(private dataSource: DataSource, private db: Db) {
    console.log('ProcessorService constructor');

    // const database = new TypeormDatabase();
    this.processor = new SubstrateProcessor();
  }
}
