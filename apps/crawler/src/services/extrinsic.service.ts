import { EventMethod, EventSection, ExtrinsicMethod } from '@common/constants';
import { capitalize, normalizeTimestamp } from '@common/utils';
import { Event } from '@entities/Event';
import { Extrinsic } from '@entities/Extrinsic';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { EventValues } from './event/event.types';

import { TokensOwners } from '@entities/TokensOwners';
import { SdkService } from '../sdk/sdk.service';
import { ExtrinsicEntity } from '@unique-nft/harvester/src/database/entities';

const EXTRINSICS_TRANSFER_METHODS = [
  ExtrinsicMethod.TRANSFER,
  ExtrinsicMethod.TRANSFER_FROM,
  ExtrinsicMethod.TRANSFER_ALL,
  ExtrinsicMethod.TRANSFER_KEEP_ALIVE,
  ExtrinsicMethod.VESTED_TRANSFER,
];

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

  upsert(extrinsicsEntity: ExtrinsicEntity[]) {
    const extrinsicsData = this.prepareDataForDbNew(extrinsicsEntity);

    return this.extrinsicsRepository.upsert(extrinsicsData, [
      'block_number',
      'extrinsic_index',
    ]);
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

  private prepareDataForDbNew(extrinsicItems): Extrinsic[] {
    return extrinsicItems.map((extrinsic) => {
      const { signer, index, events } = extrinsic;
      const blockIndex = `${extrinsic.block.id}-${index}`;
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
        timestamp: String(normalizeTimestamp(new Date(extrinsic.block.timestamp).getTime())),
        block_number: String(extrinsic.block.id),
        block_index: blockIndex,
        extrinsic_index: extrinsic.index,
        section,
        method,
        hash: extrinsic.block.hash,
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
  // private prepareDataForDb({
  //   blockCommonData,
  //   extrinsicItems,
  //   events,
  // }: {
  //   extrinsicItems: IExtrinsicExtended[];
  //   blockCommonData: IBlockCommonData;
  //   events: Event[];
  // }): Extrinsic[] {
  //   return extrinsicItems.map((extrinsic) => {
  //     const { name } = extrinsic;
  //     const [section, method] = name.split('.') as [
  //       ExtrinsicSection,
  //       ExtrinsicMethod,
  //     ];
  //
  //     const { blockTimestamp, blockNumber, ss58Prefix } = blockCommonData;
  //
  //     // Don't need to use AccountService for signer and to_owner addresses,
  //     // because all addresses are already processed in EventService.
  //     let signer = null;
  //     const { signature } = extrinsic;
  //     if (signature) {
  //       const {
  //         address: { value: rawSigner },
  //       } = signature;
  //
  //       signer = normalizeSubstrateAddress(rawSigner, ss58Prefix);
  //     }
  //
  //     const {
  //       call: { args },
  //     } = extrinsic;
  //
  //     let toOwner = null;
  //     if (EXTRINSICS_TRANSFER_METHODS.includes(method)) {
  //       const recipientAddress = args as IExtrinsicRecipient;
  //       const rawToOwner =
  //         recipientAddress?.recipient?.value || recipientAddress?.dest?.value;
  //       toOwner = normalizeSubstrateAddress(rawToOwner, ss58Prefix);
  //     }
  //
  //     const { hash, indexInBlock, success } = extrinsic;
  //
  //     const blockIndex = `${blockNumber}-${indexInBlock}`;
  //
  //     const amountValues = this.getAmountValues(blockIndex, events);
  //
  //     const { amount, fee } = amountValues;
  //
  //     return {
  //       timestamp: String(normalizeTimestamp(blockTimestamp)),
  //       block_number: String(blockNumber),
  //       block_index: blockIndex,
  //       extrinsic_index: indexInBlock,
  //       section,
  //       method,
  //       hash,
  //       success,
  //       is_signed: !!signature,
  //       signer,
  //       signer_normalized: signer && normalizeSubstrateAddress(signer),
  //       to_owner: toOwner,
  //       to_owner_normalized: toOwner && normalizeSubstrateAddress(toOwner),
  //       amount,
  //       fee,
  //     };
  //   });
  // }
}
