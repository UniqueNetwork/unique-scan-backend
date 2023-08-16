enum TABLES {
  BLOCKS = 'harvester_blocks',
  EXTRINSICS = 'harvester_extrinsics',
  EVENTS = 'harvester_events',
  EVENT_DATA_PARSED = 'harvester_event_data_parsed',
}

export const FIRST_BLOCK_QUERY = `SELECT * FROM ${TABLES.BLOCKS} ORDER BY id ASC LIMIT 1`;
export const LAST_BLOCK_QUERY = `SELECT * FROM ${TABLES.BLOCKS} ORDER BY id DESC LIMIT 1`;

const toTimestamp = (param: string) =>
  `TO_TIMESTAMP(cast(${param} as INT8) / 1000)`;

const BETWEEN_TIMESTAMPS = `BETWEEN TO_TIMESTAMP(cast($1 as INT8) / 1000) AND TO_TIMESTAMP(cast($2 as INT8) / 1000)`;

export const TOKEN_CREATED_STATISTICS_QUERY = `
SELECT COUNT(1) AS count
FROM ${TABLES.BLOCKS} hb
JOIN ${TABLES.EVENTS} he ON he."blockId" = hb.id
WHERE hb."timestamp" ${BETWEEN_TIMESTAMPS}
AND he."section" = 'common'
AND he."method" = 'ItemCreated'
;
`;

export const COLLECTION_CREATED_STATISTICS_QUERY = `
SELECT COUNT(1) AS count
FROM ${TABLES.BLOCKS} hb
JOIN ${TABLES.EVENTS} he ON he."blockId" = hb.id
WHERE hb."timestamp" BETWEEN $1::timestamp AND $2::timestamp
AND he."method" = 'CollectionCreated'
;
`;

export const BALANCE_TRANSFER_STATISTICS_QUERY = `
SELECT COUNT(1) AS count
FROM ${TABLES.BLOCKS} hb
JOIN ${TABLES.EVENTS} he ON he."blockId" = hb.id
WHERE hb."timestamp" BETWEEN $1::timestamp AND $2::timestamp
AND he."section" = 'balances'
AND he."method" = 'Transfer'
;
`;

export const TOKEN_TRANSFER_STATISTICS_QUERY = `
SELECT COUNT(1) AS count
FROM ${TABLES.BLOCKS} hb
JOIN ${TABLES.EVENTS} he ON he."blockId" = hb.id
WHERE hb."timestamp" BETWEEN $1::timestamp AND $2::timestamp
AND (he."section" = 'unique' OR section = 'common')
AND he."method" = 'Transfer';
`;

export const NEW_ACCOUNT_STATISTICS_QUERY = `
SELECT COUNT(1) AS count
FROM ${TABLES.BLOCKS} hb
JOIN ${TABLES.EVENTS} he ON he."blockId" = hb.id
WHERE hb."timestamp" BETWEEN $1::timestamp AND $2::timestamp
AND he."section" = 'system'
AND he."method" = 'NewAccount';
`;

export const EXTRINSICS_STATISTICS_QUERY = `
SELECT COUNT(1) AS count
FROM ${TABLES.BLOCKS} hb
JOIN ${TABLES.EXTRINSICS} he ON he."blockId" = hb.id
WHERE hb."timestamp" BETWEEN $1::timestamp AND $2::timestamp
AND NOT (
    (he."section" = 'parachainSystem' AND he."method" = 'setValidationData')
    OR
    (he."section" = 'timestamp' AND he."method" = 'set')
)
`;
