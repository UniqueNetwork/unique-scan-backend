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
        to_owner_normalized = 'undefined' OR 
        signer_normalized = 'undefined'
    ORDER BY block_index
    LIMIT 100;
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
  }

  if (extrinsic.to_owner?.startsWith('0x')) {
    extrinsic.to_owner = normalizeSubstrateAddress(
      extrinsic.to_owner,
      ss58Prefix,
    );
  }

  if (extrinsic.signer) {
    extrinsic.signer_normalized = normalizeSubstrateAddress(extrinsic.signer);
  }

  if (extrinsic.to_owner) {
    extrinsic.to_owner_normalized = normalizeSubstrateAddress(
      extrinsic.to_owner,
    );
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
      '${extrinsic.signer || null}',
      '${extrinsic.signer_normalized || null}',
      '${extrinsic.to_owner || null}',
      '${extrinsic.to_owner_normalized || null}'
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
      await Promise.all([
        extrinsics.map((extrinsic) =>
          convertExtrinsicAddress(queryRunner, extrinsic, ss58Prefix),
        ),
      ]);

      await queryRunner.commitTransaction();
      extrinsics = await getChunk(queryRunner);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No down
  }
}
