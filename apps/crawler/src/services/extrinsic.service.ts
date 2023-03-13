import {
  EventMethod,
  EventSection,
  ExtrinsicMethod,
  ExtrinsicSection,
} from '@common/constants';
import {
  capitalize,
  normalizeSubstrateAddress,
  normalizeTimestamp,
} from '@common/utils';
import { Event } from '@entities/Event';
import { Extrinsic } from '@entities/Extrinsic';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubstrateExtrinsic } from '@subsquid/substrate-processor';
import { Repository } from 'typeorm';
import {
  IBlockCommonData,
  IBlockItem,
} from '../subscribers/blocks.subscriber.service';
import { EventValues } from './event/event.types';

import { TokensOwners } from '@entities/TokensOwners';
import { SdkService } from '../sdk/sdk.service';
import { ExtrinsicEntity } from '@unique-nft/harvester/src/database/entities';
import { ChainProperties } from '@unique-nft/substrate-client/types';
import * as console from 'console';

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

@Injectable()
export class ExtrinsicService {
  constructor(
    @InjectRepository(Extrinsic)
    private extrinsicsRepository: Repository<Extrinsic>,

    @InjectRepository(TokensOwners)
    private tokensOwnersRepository: Repository<TokensOwners>,
    private sdkService: SdkService,
  ) {}

  upsert(
    blockNumber: number,
    blockHash: string,
    extrinsicsEntity: ExtrinsicEntity[],
    blockTimestamp,
  ) {
    const extrinsicsData = this.prepareDataForDbNew(
      extrinsicsEntity,
      blockNumber,
      blockHash,
      blockTimestamp,
    );

    return this.extrinsicsRepository.upsert(extrinsicsData, [
      'block_number',
      'extrinsic_index',
    ]);
  }

  async upsertOld({
    blockItems,
    blockCommonData,
    events,
  }: {
    blockItems: IBlockItem[];
    blockCommonData: IBlockCommonData;
    events: Event[];
  }) {
    const extrinsicItems = this.extractExtrinsicItems(blockItems);

    const extrinsicsData = this.prepareDataForDb({
      blockCommonData,
      extrinsicItems,
      events,
    });

    return this.extrinsicsRepository.upsert(extrinsicsData, [
      'block_number',
      'extrinsic_index',
    ]);
  }

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

  /**
   * Extracts amount and fee values from extrinsic's events.
   */
  private getAmountValues(blockIndex: string, eventsData: Event[]) {
    return eventsData
      .filter(
        ({ block_index: eventBlockIndex }) => eventBlockIndex === blockIndex,
      )
      .reduce(
        (acc: { amount: string; fee: string }, curr: Event) => {
          const { section, method } = curr;

          const values = curr as unknown as EventValues;
          if (!values?.amount) {
            return acc;
          }

          if (
            section === EventSection.BALANCES &&
            method == EventMethod.TRANSFER
          ) {
            acc.amount = values.amount;
          } else if (
            section === EventSection.TREASURY &&
            method == EventMethod.DEPOSIT
          ) {
            acc.fee = values.amount;
          }

          return { ...acc };
        },
        { amount: '0', fee: '0' },
      );
  }

  private prepareDataForDbNew(
    extrinsicItems,
    blockNumber,
    blockHash,
    blockTimestamp,
  ): Extrinsic[] {
    return extrinsicItems.map((extrinsic) => {
      const { signer, index, events } = extrinsic;
      const blockIndex = `${blockNumber}-${index}`;
      const amountValues = this.getAmountValues(index, events);
      const section = capitalize(extrinsic.section);
      const method = capitalize(extrinsic.method);

      // Don't need to use AccountService for signer and to_owner addresses,
      // // because all addresses are already processed in EventService.

      // let toOwner = null;
      // if (EXTRINSICS_TRANSFER_METHODS.includes(method)) {
      //   const recipientAddress = args as IExtrinsicRecipient;
      //   const rawToOwner =
      //     recipientAddress?.recipient?.value || recipientAddress?.dest?.value;
      //   toOwner = normalizeSubstrateAddress(rawToOwner, ss58Prefix);
      // }

      //
      const { amount, fee } = amountValues;

      return {
        timestamp: String(normalizeTimestamp(blockTimestamp)),
        block_number: String(blockNumber),
        block_index: blockIndex,
        extrinsic_index: extrinsic.index,
        section,
        method,
        hash: blockHash,
        success: !!signer,
        is_signed: !!signer,
        signer,
        signer_normalized: signer,
        to_owner: null, //,toOwner,
        to_owner_normalized: null, //toOwner && normalizeSubstrateAddress(toOwner),
        amount,
        fee,
      };
    });
  }
  private prepareDataForDb({
    blockCommonData,
    extrinsicItems,
    events,
  }: {
    extrinsicItems: IExtrinsicExtended[];
    blockCommonData: IBlockCommonData;
    events: Event[];
  }): Extrinsic[] {
    return extrinsicItems.map((extrinsic) => {
      const { name } = extrinsic;
      const [section, method] = name.split('.') as [
        ExtrinsicSection,
        ExtrinsicMethod,
      ];

      const { blockTimestamp, blockNumber, ss58Prefix } = blockCommonData;

      // Don't need to use AccountService for signer and to_owner addresses,
      // because all addresses are already processed in EventService.
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

      const { hash, indexInBlock, success } = extrinsic;

      const blockIndex = `${blockNumber}-${indexInBlock}`;

      const amountValues = this.getAmountValues(blockIndex, events);

      const { amount, fee } = amountValues;

      return {
        timestamp: String(normalizeTimestamp(blockTimestamp)),
        block_number: String(blockNumber),
        block_index: blockIndex,
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
}
