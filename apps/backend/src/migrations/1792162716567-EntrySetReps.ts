import { MigrationInterface, QueryRunner } from 'typeorm';

export class EntrySetReps1792162716567 implements MigrationInterface {
  name = 'EntrySetReps1792162716567';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "entries" ADD "setReps" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "entries" DROP COLUMN "setReps"`);
  }
}
