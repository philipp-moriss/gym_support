import { MigrationInterface, QueryRunner } from 'typeorm';

/** Пилатес: доп. тренировка без дистанции — distanceM становится необязательной. */
export class PilatesActivity1795096140446 implements MigrationInterface {
  name = 'PilatesActivity1795096140446';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activities" ALTER COLUMN "distanceM" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Без дистанции бывает только пилатес; при откате его записи не уложить в NOT NULL.
    await queryRunner.query(
      `DELETE FROM "activities" WHERE "distanceM" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ALTER COLUMN "distanceM" SET NOT NULL`,
    );
  }
}
