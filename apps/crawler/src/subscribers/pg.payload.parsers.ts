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
  payload: string,
): {
  from: number;
  to: number;
  pageSize: number;
} => {
  const numbers = payload.split('-').map((n) => parseInt(n.trim(), 10));

  if (numbers.length < 2) {
    throw new Error(
      `Invalid block range payload ${payload}, expected format: from-to or from-to-pageSize`,
    );
  }

  const [from, to, pageSize = 100] = numbers;

  return { from, to, pageSize };
};

/**
 * Parse string like "1/1,2,3,4,5" to object with collectionId and tokenIds
 * @param payload
 */
export const parseTokenRangePayload = (payload: string) => {
  const [collectionIdString, tokenIdsString] = payload.split('/');

  if (!collectionIdString || !tokenIdsString) {
    throw new Error(
      `Invalid token range payload ${payload}, expected format: collectionId/tokenId,tokenId,tokenId`,
    );
  }

  const collectionId = parseInt(collectionIdString, 10);
  if (isNaN(collectionId)) {
    throw new Error(
      `Invalid token range payload ${payload}, collectionId is not a number`,
    );
  }

  const tokenIds = tokenIdsString
    .split(',')
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !isNaN(n));

  return { collectionId, tokenIds };
};
