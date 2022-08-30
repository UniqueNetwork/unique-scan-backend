import { normalizeSubstrateAddress } from '../common/utils';
import { MigrationInterface, QueryResult, QueryRunner } from 'typeorm';
import { Sdk } from '@unique-nft/sdk';

interface IExtrinsic {
  block_number: string;
  extrinsic_index: number;
  signer: string;
  signer_normalized: string;
  to_owner: string;
  to_owner_normalized: string;
}

function getStringOrNull(str) {
  return str ? `'${str}'` : 'NULL';
}

async function getChainPrefix(): Promise<number> {
  const chainWsUrl = process.env.CHAIN_WS_URL;
  const sdk = new Sdk({
    chainWsUrl,
  });

  await sdk.connect();

  const chainProperties = sdk.chainProperties();
  return chainProperties.SS58Prefix;
}

async function getChunk(queryRunner: QueryRunner): Promise<IExtrinsic[]> {
  const qSelect = `SELECT
        block_number,
        extrinsic_index,
        signer,
        signer_normalized,
        to_owner,
        to_owner_normalized
    FROM
        extrinsic
    WHERE
        (signer LIKE '0x%' AND LENGTH(signer) > 42) OR
        (to_owner LIKE '0x%' AND LENGTH(to_owner) > 42) OR

        -- Strings 'null' or 'undefined'
        (to_owner_normalized IS NOT NULL AND LENGTH(to_owner_normalized) < 10) OR
        (signer_normalized IS NOT NULL AND LENGTH(signer_normalized) < 10)
    ORDER BY block_index
    LIMIT 50;
  `;
  return await queryRunner.query(qSelect);
}

async function convertExtrinsicAddress(
  queryRunner: QueryRunner,
  extrinsic: IExtrinsic,
  ss58Prefix: number,
): Promise<QueryResult> {
  if (extrinsic.signer?.startsWith('0x')) {
    extrinsic.signer = normalizeSubstrateAddress(extrinsic.signer, ss58Prefix);
  } else if (extrinsic.signer?.length < 10) {
    extrinsic.signer = null;
  }

  if (extrinsic.to_owner?.startsWith('0x')) {
    extrinsic.to_owner = normalizeSubstrateAddress(
      extrinsic.to_owner,
      ss58Prefix,
    );
  } else if (extrinsic.to_owner?.length < 10) {
    extrinsic.to_owner = null;
  }

  if (extrinsic.signer) {
    extrinsic.signer_normalized = normalizeSubstrateAddress(extrinsic.signer);
  } else {
    extrinsic.signer_normalized = null;
  }

  if (extrinsic.to_owner) {
    extrinsic.to_owner_normalized = normalizeSubstrateAddress(
      extrinsic.to_owner,
    );
  } else {
    extrinsic.to_owner_normalized = null;
  }

  return queryRunner.query(`
    UPDATE extrinsic SET
    (
      "signer",
      "signer_normalized",
      "to_owner",
      "to_owner_normalized"
    ) =
    (
      ${getStringOrNull(extrinsic.signer || null)},
      ${getStringOrNull(extrinsic.signer_normalized || null)},
      ${getStringOrNull(extrinsic.to_owner || null)},
      ${getStringOrNull(extrinsic.to_owner_normalized || null)}
    )
    WHERE
      block_number = ${extrinsic.block_number}
      AND extrinsic_index = ${extrinsic.extrinsic_index};
  `);
}

export class extrinsicsAddressesEncode1661763490773
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const ss58Prefix = await getChainPrefix();

    let extrinsics = await getChunk(queryRunner);

    while (extrinsics.length > 0) {
      await queryRunner.startTransaction();
      await Promise.all(
        extrinsics.map((extrinsic) =>
          convertExtrinsicAddress(queryRunner, extrinsic, ss58Prefix),
        ),
      );

      await queryRunner.commitTransaction();
      extrinsics.length = 0;
      extrinsics = await getChunk(queryRunner);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No down
  }
}
