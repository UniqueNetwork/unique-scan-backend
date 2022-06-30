import { ScanProcessor } from './scan-processor';
import { Injectable } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from './model';

@Injectable()
export class CollectionsProcessor extends ScanProcessor {
  constructor(
    @InjectRepository(Model) private modelRepository: Repository<Model>,
    connection: Connection,
  ) {
    super(
      'collections',
      connection,
    );
  }
}
