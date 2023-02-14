import {
  EventMethod,
  EventSection,
  ExtrinsicMethod,
  ExtrinsicSection,
} from '@common/constants';
import { normalizeSubstrateAddress, normalizeTimestamp } from '@common/utils';
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
import { Tokens } from '@entities/Tokens';

const EXTRINSICS_TRANSFER_METHODS = [
  ExtrinsicMethod.TRANSFER,
  ExtrinsicMethod.TRANSFER_FROM,
  ExtrinsicMethod.TRANSFER_ALL,
  ExtrinsicMethod.TRANSFER_KEEP_ALIVE,
  ExtrinsicMethod.VESTED_TRANSFER,
];

const EVENTS_METHODS = [
  EventMethod.ITEM_CREATED,
  EventMethod.COLLECTION_CREATED,
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
    @InjectRepository(Tokens)
    private tokensRepository: Repository<Tokens>,
    private sdkService: SdkService,
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
      const { blockTimestamp, blockNumber, ss58Prefix, blockHash } =
        blockCommonData;

      const {
        call: { args },
      } = extrinsic;
      let signer = null;
      // Don't need to use AccountService for signer and to_owner addresses,
      // because all addresses are already processed in EventService.

      const { signature } = extrinsic;
      if (signature) {
        const {
          address: { value: rawSigner },
        } = signature;
        signer = normalizeSubstrateAddress(rawSigner, ss58Prefix);
      }

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

  private prepareTokenForDb(
    blockCommonData: IBlockCommonData,
    events: Event[],
  ): any {
    const { blockTimestamp, blockNumber } = blockCommonData;
    const substrateAddress = [];
    events.map(async (event) => {
      const extrinsicsEventName = `${event.section}.${event.method}`;
      if (extrinsicsEventName !== 'Common.Transfer') {
        return;
      }

      const { to, from, tokenId, collectionId } = event?.values as any;

      substrateAddress.push({
        owner: from.value,
        owner_normalized: normalizeSubstrateAddress(from.value),
        collection_id: collectionId,
        token_id: tokenId,
        date_created: String(normalizeTimestamp(blockTimestamp)),
        block_number: blockNumber,
      });
      substrateAddress.push({
        owner: to.value,
        owner_normalized: normalizeSubstrateAddress(to.value),
        collection_id: collectionId,
        token_id: tokenId,
        date_created: String(normalizeTimestamp(blockTimestamp)),
        block_number: blockNumber,
      });
    });

    return substrateAddress;
  }

  async upsert({
    blockItems,
    blockCommonData,
    events,
  }: {
    blockItems: IBlockItem[];
    blockCommonData: IBlockCommonData;
    events: Event[];
  }) {
    const extrinsicItems = this.extractExtrinsicItems(blockItems);
    const extrinsicTokenTransfer = this.prepareTokenForDb(
      blockCommonData,
      events,
    );

    for (const extrinsic of extrinsicTokenTransfer) {
      if (extrinsic.token_id) {
        const pieceToken = await this.sdkService.getRFTBalances({
          address: extrinsic.owner,
          collectionId: extrinsic.collection_id,
          tokenId: extrinsic.token_id,
        });
        const updateTokenTransfer = { ...extrinsic, ...pieceToken };
        //await this.updateOrSaveTokenOwnerPart(extrinsic, updateTokenTransfer);
        await this.tokensOwnersRepository.upsert({ ...updateTokenTransfer }, [
          'collection_id',
          'token_id',
          'owner',
        ]);
      }
    }

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

  private async updateOrSaveTokenOwnerPart(ext: any, updateData: any) {
    const token = await this.tokensRepository.findOne({
      where: { collection_id: ext.collection_id, token_id: ext.token_id },
    });
    const ownerToken = await this.tokensOwnersRepository.findOne({
      where: {
        owner: ext.owner,
        collection_id: ext.collection_id,
        token_id: ext.token_id,
      },
    });
    try {
      if (ownerToken !== null) {
        await this.tokensOwnersRepository.update(
          {
            owner: ext.owner,
            collection_id: ext.collection_id,
            token_id: ext.token_id,
          },
          {
            amount: updateData.amount,
            type: token.type,
            block_number: updateData.block_number,
          },
        );
      } else {
        //await this.tokensOwnersRepository.save(updateData);
        await this.tokensOwnersRepository.save({
          ...updateData,
          type: token.type,
        });
      }
    } catch (e) {
      throw new Error(e);
    }
  }
}
