const DEFAULT_EVENT_SECTIONS_FOR_RESCAN = [
  'common',
  'unique',
  'balances',
  'appPromotion',
];

export type ParsedRescanPayload = {
  from: number;
  to: number;
  pageSize: number;
  eventSections: string[];
};

export type NextBlocksQueryParams = ParsedRescanPayload & {
  page: number;
};

/**
 * Parse string like "1,2,3,4,5" to array of numbers
 * @param payload
 */
export const parseBlockNumbersPayload = (payload: string): number[] => {
  return payload
    .split(',')
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !isNaN(n));
};

/**
 * Parse string like "1-100" or "1-100-50" to object with from, to and pageSize
 * @param payload
 */
export const parseBlockRangePayload = (
  payload: string
): ParsedRescanPayload => {
  const [numbersPart, sectionsPart] = payload.split('/');
  const numbers = numbersPart.split('-').map((n) => parseInt(n.trim(), 10));

  if (numbers.length < 2) {
    throw new Error(
      `Invalid block range payload ${payload}, expected format: from-to[-pageSize][/section,section]`
    );
  }

  const [from, to, pageSize = 100] = numbers;

  const eventSections = sectionsPart
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (eventSections.length === 0)
    eventSections.push(...DEFAULT_EVENT_SECTIONS_FOR_RESCAN);

  return { from, to, pageSize, eventSections };
};

/**
 * Parse string like "1/1,2,3,4,5@block_number" to object with collectionId, tokenIds and blockNumber
 * @param payload
 */
export const parseTokenRangePayload = (payload: string) => {
  const [collectionIdString, tokenIdsString, blockNumberString] =
    payload.split(/[\/@]/);

  if (!collectionIdString || !tokenIdsString || !blockNumberString) {
    throw new Error(
      `Invalid token range payload ${payload}, expected format: collectionId/tokenId,tokenId@blockNumber`
    );
  }

  const collectionId = parseInt(collectionIdString, 10);
  if (isNaN(collectionId)) {
    throw new Error(
      `Invalid token range payload ${payload}, collectionId is not a number`
    );
  }

  const blockNumber = parseInt(blockNumberString, 10);
  if (isNaN(blockNumber)) {
    throw new Error(
      `Invalid token range payload ${payload}, blockNumber is not a number`
    );
  }

  const tokenIds = tokenIdsString
    .split(',')
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !isNaN(n));

  return { collectionId, tokenIds, blockNumber };
};
