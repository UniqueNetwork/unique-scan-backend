import { normalizeSubstrateAddress } from '../common/utils';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { BREAK } from 'graphql';

function getStringOrNull(str) {
  return str ? `'${str}'` : 'NULL';
}

async function convertChunk({ queryRunner, ss58Prefix, limit, offset }) {
  const qSelect = `SELECT 
        block_number,
        extrinsic_index,
        signer,
        to_owner
    FROM
        extrinsic 
    WHERE 
        (signer LIKE '0x%' AND LENGTH(signer) > 42) OR
        (to_owner LIKE '0x%' AND LENGTH(to_owner) > 42) 
    LIMIT ${limit} OFFSET ${offset}`;

  const rows = await queryRunner.query(qSelect);

  if (!rows.length) {
    return false;
  }

  // console.log(rows);
  await Promise.all(
    rows.map((row) => {
      const { signer: rawSigner, to_owner: rawToOwner } = row;
      const result = {};
      if (rawSigner) {
        const signer = normalizeSubstrateAddress(rawSigner, ss58Prefix);
        const signerNormalized = normalizeSubstrateAddress(signer);
        Object.assign(result, {
          signer,
          signer_normalized: signerNormalized,
        });
      }

      if (rawToOwner) {
        const toOwner = normalizeSubstrateAddress(rawToOwner, ss58Prefix);
        const toOwnerNormalized = normalizeSubstrateAddress(toOwner);
        Object.assign(result, {
          to_owner: toOwner,
          to_owner_normalized: toOwnerNormalized,
        });
      }

      const resultRow = Object.assign(row, result);

      //   console.log('resultRow', resultRow);

      const {
        block_number,
        extrinsic_index,
        signer = null,
        signer_normalized = null,
        to_owner = null,
        to_owner_normalized = null,
      } = resultRow;

      const qUpdate = `
        UPDATE extrinsic SET 
            (signer, signer_normalized, to_owner, to_owner_normalized) = 
            (${getStringOrNull(signer)},
            ${getStringOrNull(signer_normalized)}, ${getStringOrNull(
        to_owner,
      )}, ${getStringOrNull(to_owner_normalized)})
        WHERE 
            block_number = ${block_number} 
            AND extrinsic_index = ${extrinsic_index}`;

      //   console.log(qUpdate);
      //   return queryRunner.query(qUpdate);
    }),
  );

  return true;
}

export class extrinsicsAddressesEncode1661763490773
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const limit = 200;
    let offset = 0;
    let iterations = 0;
    const ss58Prefix = 42; // todo: Get chain specific prefix

    while (iterations < 10000000) {
      const result = await convertChunk({
        queryRunner,
        ss58Prefix,
        limit,
        offset,
      });

      console.log(result);

      if (!result) {
        console.log({ iterations });
        return;
      }

      offset += limit;
      iterations += 1;
    }

    console.log('Too much iterations', iterations);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No down
  }
}
