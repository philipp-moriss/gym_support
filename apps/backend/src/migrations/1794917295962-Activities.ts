import { MigrationInterface, QueryRunner } from 'typeorm';

export class Activities1794917295962 implements MigrationInterface {
  name = 'Activities1794917295962';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "date" date NOT NULL, "kind" character varying(10) NOT NULL, "poolLength" smallint, "laps" integer, "distanceM" integer NOT NULL, "durationSec" integer NOT NULL, "notes" text NOT NULL DEFAULT '', CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dddbc83850906d039328c00f75" ON "activities"  ("userId", "date") `,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD CONSTRAINT "FK_activities_account" FOREIGN KEY ("userId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activities" DROP CONSTRAINT "FK_activities_account"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dddbc83850906d039328c00f75"`,
    );
    await queryRunner.query(`DROP TABLE "activities"`);
  }
}
