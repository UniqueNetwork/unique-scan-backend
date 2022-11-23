import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from '@entities/Event';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { EvmTransaction } from '@entities/EvmTransaction';
import { Config } from '../../config/config.module';
import { SentryService } from '@ntegral/nestjs-sentry';

@Injectable()
export class EvmService {
  provider: ethers.providers.JsonRpcProvider;

  constructor(
    @InjectRepository(EvmTransaction)
    private transactionRepository: Repository<EvmTransaction>,
    private configService: ConfigService<Config>,
    private readonly sentry: SentryService,
  ) {
    this.provider = new ethers.providers.JsonRpcProvider(
      this.configService.get('rpcProviderUrl'),
    );

    this.sentry.setContext(EvmService.name);
  }

  public async parseEvents(events: Event[]) {
    try {
      const transactions: ethers.providers.TransactionReceipt[] = [];

      for (const event of events) {
        const [, , transactionHash] = event.data.split(',');
        if (transactionHash && typeof transactionHash === 'string') {
          const hash = transactionHash.replaceAll('"', '');

          const transaction = await (
            await this.provider.getTransaction(hash)
          ).wait();

          transactions.push(transaction);
        }
      }

      if (transactions.length) {
        await this.transactionRepository.upsert(
          transactions.map(this.convertForDb),
          ['block_hash', 'transaction_hash'],
        );
      }
    } catch (error) {
      this.sentry.instance().captureException({ error });
    }
  }

  private convertForDb(transaction: ethers.providers.TransactionReceipt) {
    const {
      to,
      from,
      byzantium,
      transactionHash,
      confirmations,
      cumulativeGasUsed,
      status,
      type,
      blockNumber,
      gasUsed,
      effectiveGasPrice,
      blockHash,
      logsBloom,
      transactionIndex,
      contractAddress,
    } = transaction;

    return {
      to,
      from,
      contract_address: contractAddress,
      transaction_index: transactionIndex,
      gas_used: gasUsed.toNumber(),
      logs_bloom: logsBloom,
      block_hash: blockHash,
      transaction_hash: transactionHash,
      block_number: blockNumber,
      confirmations,
      cumulative_gas_used: cumulativeGasUsed.toNumber(),
      effective_gas_price: effectiveGasPrice.toNumber(),
      status,
      type,
      byzantium,
    };
  }
}
