import {
  EventName,
  ExtrinsicMethod,
  ExtrinsicSection,
} from '@common/constants';
import {
  getAmount,
  normalizeSubstrateAddress,
  normalizeTimestamp,
} from '@common/utils';
import { Extrinsic } from '@entities/Extrinsic';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubstrateExtrinsic } from '@subsquid/substrate-processor';
import { Repository } from 'typeorm';
import {
  IBlockCommonData,
  IBlockItem,
} from '../subscribers/blocks.subscriber.service';
import { EventArgumentsService } from './event/event.arguments.service';
import { EventService } from './event/event.service';

const EXTRINSICS_TRANSFER_METHODS = [
  ExtrinsicMethod.TRANSFER,
  ExtrinsicMethod.TRANSFER_FROM,
  ExtrinsicMethod.TRANSFER_ALL,
  ExtrinsicMethod.TRANSFER_KEEP_ALIVE,
  ExtrinsicMethod.VESTED_TRANSFER,
];

export interface IExtrinsicExtended extends SubstrateExtrinsic {
  name: string;
}

interface IExtrinsicRecipient {
  // Unique.transfer
  recipient?: { value: string };

  // Balances.transfer
  // Balances.transfer_all
  // Balances.transfer_keep_alive
  // Vesting.vested_transfer
  dest?: { value: string };
}

const EVENT_NAMES_WITH_AMOUNTS = [
  EventName.BALANCES_TRANSFER,
  EventName.TREASURY_DEPOSIT,
];

@Injectable()
export class ExtrinsicWriterService {
  constructor(
    @InjectRepository(Extrinsic)
    private extrinsicsRepository: Repository<Extrinsic>,
  ) {}

  private extractExtrinsicItems(items: IBlockItem[]): IExtrinsicExtended[] {
    return items
      .map((item) => {
        const { kind } = item;
        if (kind === 'call') {
          const { name, extrinsic } = item;
          return { name, ...extrinsic } as IExtrinsicExtended;
        }
        return null;
      })
      .filter((v) => !!v);
  }

  // todo: Should do this in EventService
  private getAmountValues(blockItems: IBlockItem[]) {
    const eventItems = EventService.extractEventItems(blockItems);

    // Save 'amount' and 'fee' for extrinsic's events
    return eventItems.reduce((acc, curr) => {
      const { name, extrinsic, args } = curr;

      const extrinsicId = extrinsic?.id;
      if (!extrinsicId || !EVENT_NAMES_WITH_AMOUNTS.includes(name)) {
        return acc;
      }

      const rawAmount = EventArgumentsService.extractRawAmountValue(args);

      const amount = getAmount(rawAmount);

      acc[extrinsicId] = acc[extrinsicId] || {};

      if (name === EventName.BALANCES_TRANSFER) {
        acc[extrinsicId].amount = amount;
      } else if (name === EventName.TREASURY_DEPOSIT) {
        acc[extrinsicId].fee = amount;
      }

      return { ...acc };
    }, {});
  }

  private prepareDataForDb({
    extrinsicItems,
    amountValues,
    blockCommonData,
  }: {
    extrinsicItems: IExtrinsicExtended[];
    amountValues: {
      [key: string]: { amount?: string; fee?: string };
    };
    blockCommonData: IBlockCommonData;
  }): Extrinsic[] {
    return extrinsicItems.map((extrinsic) => {
      const { name } = extrinsic;
      const [section, method] = name.split('.') as [
        ExtrinsicSection,
        ExtrinsicMethod,
      ];

      const { blockTimestamp, blockNumber, ss58Prefix } = blockCommonData;

      // todo: Normalize signer and toOwner using AccountService
      let signer = null;
      const { signature } = extrinsic;
      if (signature) {
        const {
          address: { value: rawSigner },
        } = signature;

        signer = normalizeSubstrateAddress(rawSigner, ss58Prefix);
      }

      const {
        call: { args },
      } = extrinsic;

      let toOwner = null;
      if (EXTRINSICS_TRANSFER_METHODS.includes(method)) {
        const recipientAddress = args as IExtrinsicRecipient;
        const rawToOwner =
          recipientAddress?.recipient?.value || recipientAddress?.dest?.value;
        toOwner = normalizeSubstrateAddress(rawToOwner, ss58Prefix);
      }

      const { id, hash, indexInBlock, success } = extrinsic;

      const { amount = '0', fee = '0' } = amountValues[id] || {};

      return {
        timestamp: String(normalizeTimestamp(blockTimestamp)),
        block_number: String(blockNumber),
        block_index: `${blockNumber}-${indexInBlock}`,
        extrinsic_index: indexInBlock,
        section,
        method,
        hash,
        success,
        is_signed: !!signature,
        signer,
        signer_normalized: signer && normalizeSubstrateAddress(signer),
        to_owner: toOwner,
        to_owner_normalized: toOwner && normalizeSubstrateAddress(toOwner),
        amount,
        fee,
      };
    });
  }

  async upsert({
    blockItems,
    blockCommonData,
  }: {
    blockItems: IBlockItem[];
    blockCommonData: IBlockCommonData;
  }) {
    const extrinsicItems = this.extractExtrinsicItems(blockItems);

    const amountValues = this.getAmountValues(blockItems);

    const extrinsicsData = this.prepareDataForDb({
      blockCommonData,
      extrinsicItems,
      amountValues,
    });

    return this.extrinsicsRepository.upsert(extrinsicsData, [
      'block_number',
      'extrinsic_index',
    ]);
  }
}
