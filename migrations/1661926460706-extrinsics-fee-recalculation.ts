import { getAmount } from '@common/utils';
import { MigrationInterface, QueryResult, QueryRunner } from 'typeorm';

interface IExtrinsicData {
  block_number: number;
  extrinsic_index: number;
  args: null | string | object;
  fee: string;
}

async function getChunk(queryRunner: QueryRunner): Promise<IExtrinsicData[]> {
  const qSelect = `
    SELECT
        ex.block_number, 
        ex.extrinsic_index, 
        ev.data AS args,
        ex.fee
    FROM extrinsic AS ex
    LEFT JOIN event AS ev ON 
        ev.block_index=ex.block_index AND 
        ev.section='Treasury' AND 
        ev.method='Deposit'
    WHERE ex.fee='NaN'
    ORDER BY ex.block_number
    LIMIT 50;`;
  return await queryRunner.query(qSelect);
}

async function recalculateExtrinsicFee(
  queryRunner: QueryRunner,
  extrinsic: IExtrinsicData,
): Promise<QueryResult> {
  const { args } = extrinsic;
  if (!args) {
    extrinsic.fee = '0';
  } else {
    const rawAmount =
      typeof args === 'string' ? args : args['amount'] || args['value'];
    extrinsic.fee = getAmount(rawAmount);
  }

  return queryRunner.query(`
      UPDATE extrinsic SET 
        fee=${extrinsic.fee}
      WHERE
        block_number = ${extrinsic.block_number}
        AND extrinsic_index = ${extrinsic.extrinsic_index};
    `);
}

export class extrinsicsFeeRecalculation1661926460706
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    let extrinsics = await getChunk(queryRunner);

    while (extrinsics.length > 0) {
      await queryRunner.startTransaction();
      await Promise.all(
        extrinsics.map((extrinsic) =>
          recalculateExtrinsicFee(queryRunner, extrinsic),
        ),
      );

      await queryRunner.commitTransaction();
      extrinsics.length = 0;
      extrinsics = await getChunk(queryRunner);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Not one step back
  }
}
