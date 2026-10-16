import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1792147732353 implements MigrationInterface {
  name = 'Init1792147732353';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "login" character varying(40) NOT NULL, "codeHash" character varying(200) NOT NULL, "failedAttempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP WITH TIME ZONE, "sessionsVersion" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2b995c673f59534efe164ced42" ON "accounts"  ("login") `,
    );
    await queryRunner.query(
      `CREATE TABLE "drafts" ("userId" uuid NOT NULL, "date" date NOT NULL, "items" jsonb NOT NULL DEFAULT '{}', "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6b4e9f2a1131fc1e9c5ba6ceaeb" PRIMARY KEY ("userId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "userSessionsVersion" integer NOT NULL, "tokenHash" character varying(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, "userAgent" character varying(300), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_57de40bc620f456c7311aa3a1e" ON "sessions"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bace6c68efc156fddac9b14bda" ON "sessions"  ("tokenHash") `,
    );
    await queryRunner.query(
      `CREATE TABLE "entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "date" date NOT NULL, "week" integer, "exerciseId" character varying(40), "exercise" character varying(160) NOT NULL, "sets" integer NOT NULL, "reps" integer NOT NULL, "weight" numeric(7,2) NOT NULL DEFAULT '0', "pain" smallint, "effort" smallint, "notes" text NOT NULL DEFAULT '', CONSTRAINT "PK_23d4e7e9b58d9939f113832915b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b25fa69742314d5856cdea9987" ON "entries"  ("userId", "date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "exercises" ("userId" uuid NOT NULL, "id" character varying(40) NOT NULL, "position" integer NOT NULL DEFAULT '0', "name" character varying(120) NOT NULL, "short" character varying(60) NOT NULL, "muscle" character varying(20) NOT NULL, "group" character varying(10) NOT NULL, "unit" character varying(5) NOT NULL, "perSide" boolean NOT NULL DEFAULT false, "base" numeric(7,2), "step" numeric(5,2) NOT NULL DEFAULT '0', "weeks" jsonb, "alternativeOf" character varying(40), "tips" jsonb NOT NULL DEFAULT '[]', "days" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_bc20364693847216dd6e821f7ac" PRIMARY KEY ("userId", "id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "program_settings" ("userId" uuid NOT NULL, "startDate" date NOT NULL, "swaps" jsonb NOT NULL DEFAULT '{}', "resetAt" date, "schedule" jsonb NOT NULL, "rules" jsonb NOT NULL DEFAULT '[]', "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_75ed2e298000b8815669fe55758" PRIMARY KEY ("userId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "drafts" ADD CONSTRAINT "FK_drafts_account" FOREIGN KEY ("userId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_sessions_account" FOREIGN KEY ("userId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entries" ADD CONSTRAINT "FK_entries_account" FOREIGN KEY ("userId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD CONSTRAINT "FK_exercises_account" FOREIGN KEY ("userId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "program_settings" ADD CONSTRAINT "FK_program_settings_account" FOREIGN KEY ("userId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "program_settings" DROP CONSTRAINT "FK_program_settings_account"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" DROP CONSTRAINT "FK_exercises_account"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entries" DROP CONSTRAINT "FK_entries_account"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_sessions_account"`,
    );
    await queryRunner.query(
      `ALTER TABLE "drafts" DROP CONSTRAINT "FK_drafts_account"`,
    );
    await queryRunner.query(`DROP TABLE "program_settings"`);
    await queryRunner.query(`DROP TABLE "exercises"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b25fa69742314d5856cdea9987"`,
    );
    await queryRunner.query(`DROP TABLE "entries"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bace6c68efc156fddac9b14bda"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57de40bc620f456c7311aa3a1e"`,
    );
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "drafts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2b995c673f59534efe164ced42"`,
    );
    await queryRunner.query(`DROP TABLE "accounts"`);
  }
}
