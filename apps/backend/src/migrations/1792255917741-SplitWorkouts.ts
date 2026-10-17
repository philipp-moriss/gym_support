import { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitWorkouts1792255917741 implements MigrationInterface {
  name = 'SplitWorkouts1792255917741';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD "workouts" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "program_settings" ADD "workouts" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "program_settings" DROP COLUMN "workouts"`,
    );
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "workouts"`);
  }
}
