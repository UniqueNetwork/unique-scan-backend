/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class createTableEvmTransactions1669282125743
  implements MigrationInterface
{
  name = 'createTableEvmTransactions1669282125743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "evm_transaction" ("to" text NOT NULL, "from" text NOT NULL, "contract_address" text, "transaction_index" integer NOT NULL, "gas_used" bigint NOT NULL, "logs_bloom" text NOT NULL, "block_hash" text NOT NULL, "transaction_hash" text NOT NULL, "block_number" integer NOT NULL, "confirmations" integer NOT NULL, "cumulative_gas_used" bigint NOT NULL, "effective_gas_price" bigint NOT NULL, "status" integer NOT NULL, "type" integer NOT NULL, "byzantium" boolean NOT NULL, "timestamp" bigint, CONSTRAINT "PK_41683d88bbaa4ca5ed51fc328c7" PRIMARY KEY ("block_hash", "transaction_hash"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "evm_transaction_pkey" ON "evm_transaction" ("transaction_hash") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."evm_transaction_pkey"`);
    await queryRunner.query(`DROP TABLE "evm_transaction"`);
  }
}
