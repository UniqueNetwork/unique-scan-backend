import { encodeAddress, decodeAddress } from '@polkadot/util-crypto';
import BigNumber from 'bignumber.js';
import { Event } from '@entities/Event';
import { Injectable } from '@nestjs/common';
import { EventMethod, EventPhase, EventSection } from '@common/constants';
import { ETHEREUM_ADDRESS_MAX_LENGTH } from '../constants';

@Injectable()
export class UtilsService {
  getAmount(strNum: string) {
    BigNumber.config({
      EXPONENTIAL_AT: [-30, 30],
    });

    const result = new BigNumber(strNum);
    const dividedBy = result.dividedBy('1000000000000000000').toString();

    return dividedBy;
  }

  getExtrinsicSuccess(events: Event[]) {
    if (events.length === 0) {
      return true;
    }

    return !!events.find(
      ({ section, method }) =>
        section === EventSection.SYSTEM &&
        method === EventMethod.EXTRINSIC_SUCCESS,
    );
  }

  getExtrinsicAmount(events: Event[]) {
    return events
      .filter(
        ({ section, method }) =>
          section === EventSection.BALANCES && method === EventMethod.TRANSFER,
      )
      .reduce((sum, { amount }) => {
        const am = parseFloat(amount) || 0;
        return sum + am;
      }, 0);
  }

  getExtrinsicFee(events: Event[]) {
    return events
      .filter(
        ({ section, method }) =>
          section === EventSection.TREASURY && method === EventMethod.DEPOSIT,
      )
      .reduce((sum, { amount }) => {
        const am = parseFloat(amount) || 0;
        return sum + am;
      }, 0);
  }

  parseAmount(event: Event) {
    const { phase, method, data, section } = event;

    let result = '0';
    let amountIndex = null;

    if (
      phase !== EventPhase.INITIALIZATION &&
      [
        EventMethod.TRANSFER,
        EventMethod.DEPOSIT,
        EventMethod.WITHDRAW,
      ].includes(method as EventMethod)
    ) {
      if (section === EventSection.BALANCES) {
        amountIndex =
          method === EventMethod.DEPOSIT || method === EventMethod.WITHDRAW
            ? 1
            : 2;
      } else if (section === EventSection.TREASURY) {
        amountIndex = 0;
      }

      if (amountIndex !== null) {
        const value = (JSON.parse(data)[amountIndex]?.value ||
          JSON.parse(data)[amountIndex]) as string;

        result = this.getAmount(value.toString());
      }
    }

    return result;
  }

  normalizeSubstrateAddress(address?: string) {
    if (!address) {
      return null;
    }

    if (address?.length <= ETHEREUM_ADDRESS_MAX_LENGTH) {
      return address;
    }

    return encodeAddress(decodeAddress(address));
  }
}
