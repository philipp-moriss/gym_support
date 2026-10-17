import { MigrationInterface, QueryRunner } from 'typeorm';

export class DoubleProgression1792254941500 implements MigrationInterface {
  name = 'DoubleProgression1792254941500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD "baseSetAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD "targetSets" smallint NOT NULL DEFAULT '3'`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD "repsMin" smallint NOT NULL DEFAULT '12'`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD "repsMax" smallint NOT NULL DEFAULT '15'`,
    );
    // Недельные проценты (55–85% от базы) убраны: тренировка идёт с рабочим весом.
    // Прежняя «база» выше реального рабочего веса — берём уровень 4-й недели (85%),
    // вниз до шага. Где записи есть, расчёт всё равно идёт от реально поднятого веса.
    await queryRunner.query(`
          UPDATE "exercises" SET "base" = CASE
            WHEN "step" > 0 THEN floor("base" * 0.85 / "step") * "step"
            ELSE round("base" * 0.85, 2)
          END
          WHERE "base" IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          UPDATE "exercises" SET "base" = CASE
            WHEN "step" > 0 THEN ceil("base" / 0.85 / "step") * "step"
            ELSE round("base" / 0.85, 2)
          END
          WHERE "base" IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "repsMax"`);
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "repsMin"`);
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "targetSets"`);
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "baseSetAt"`);
  }
}
