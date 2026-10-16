import { MigrationInterface, QueryRunner } from 'typeorm';

export class CodeLookup1792160404947 implements MigrationInterface {
  name = 'CodeLookup1792160404947';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "codeLookup" character varying(64)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c3df69eec66f65a713df471b92" ON "accounts"  ("codeLookup") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c3df69eec66f65a713df471b92"`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "codeLookup"`);
  }
}
