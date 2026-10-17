import { MigrationInterface, QueryRunner } from 'typeorm';

export class Coaching1792227922874 implements MigrationInterface {
  name = 'Coaching1792227922874';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "login" character varying(40) NOT NULL, "passwordHash" character varying(200) NOT NULL, "failedAttempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP WITH TIME ZONE, "sessionsVersion" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_e3b38270c97a854c48d2e80874e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3d704d9a959cb04ba6f7e942dd" ON "admins"  ("login") `,
    );
    await queryRunner.query(
      `CREATE TABLE "prompt_templates" ("slot" character varying(40) NOT NULL, "text" text NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9ef9514c84124769d2eb338bcb0" PRIMARY KEY ("slot"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_analyses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clientId" uuid NOT NULL, "coachId" uuid NOT NULL, "status" character varying(10) NOT NULL DEFAULT 'pending', "result" jsonb, "error" text, "appliedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_f668f96ca6b8cd3dd8ebbd5c576" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_edbd1dd38e16b110a805ed2d09" ON "ai_analyses"  ("coachId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_af40c8756fa1deaad03a609123" ON "ai_analyses"  ("clientId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "client_notes" ("clientId" uuid NOT NULL, "coachId" uuid NOT NULL, "text" text NOT NULL DEFAULT '', "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4326d3a359321921d78fe82a142" PRIMARY KEY ("clientId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "coach_clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachId" uuid NOT NULL, "clientId" uuid NOT NULL, "alias" character varying(80), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "unlinkedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_c9c033ec3a8a43688fae5b40ab3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_244a275469ffc8342546d1d246" ON "coach_clients"  ("coachId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_coach_clients_active_client" ON "coach_clients"  ("clientId") WHERE "unlinkedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "coach_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachId" uuid NOT NULL, "codeLookup" character varying(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, "usedBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_21156529e9ffcd70cd178816857" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_71db8c69826b113e313f1ad43c" ON "coach_invites"  ("codeLookup") `,
    );
    await queryRunner.query(
      `CREATE TABLE "program_changes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "actorId" uuid NOT NULL, "exerciseId" character varying(40), "exercise" character varying(120), "field" character varying(20) NOT NULL, "before" text, "after" text, "reason" text, "source" character varying(10) NOT NULL DEFAULT 'manual', "seenAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_faea080b6d177d6abf67feb30f8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f62008a2b9632e5d3efedff06" ON "program_changes"  ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "role" character varying(10) NOT NULL DEFAULT 'client'`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "name" character varying(80)`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "disabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "aiDailyLimit" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ADD CONSTRAINT "FK_ai_analyses_client" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ADD CONSTRAINT "FK_ai_analyses_coach" FOREIGN KEY ("coachId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_notes" ADD CONSTRAINT "FK_client_notes_client" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_clients" ADD CONSTRAINT "FK_coach_clients_coach" FOREIGN KEY ("coachId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_clients" ADD CONSTRAINT "FK_coach_clients_client" FOREIGN KEY ("clientId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_invites" ADD CONSTRAINT "FK_coach_invites_coach" FOREIGN KEY ("coachId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "program_changes" ADD CONSTRAINT "FK_program_changes_account" FOREIGN KEY ("userId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "program_changes" DROP CONSTRAINT "FK_program_changes_account"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_invites" DROP CONSTRAINT "FK_coach_invites_coach"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_clients" DROP CONSTRAINT "FK_coach_clients_client"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_clients" DROP CONSTRAINT "FK_coach_clients_coach"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_notes" DROP CONSTRAINT "FK_client_notes_client"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" DROP CONSTRAINT "FK_ai_analyses_coach"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" DROP CONSTRAINT "FK_ai_analyses_client"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP COLUMN "aiDailyLimit"`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "disabled"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "role"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f62008a2b9632e5d3efedff06"`,
    );
    await queryRunner.query(`DROP TABLE "program_changes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_71db8c69826b113e313f1ad43c"`,
    );
    await queryRunner.query(`DROP TABLE "coach_invites"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_coach_clients_active_client"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_244a275469ffc8342546d1d246"`,
    );
    await queryRunner.query(`DROP TABLE "coach_clients"`);
    await queryRunner.query(`DROP TABLE "client_notes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_af40c8756fa1deaad03a609123"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_edbd1dd38e16b110a805ed2d09"`,
    );
    await queryRunner.query(`DROP TABLE "ai_analyses"`);
    await queryRunner.query(`DROP TABLE "prompt_templates"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d704d9a959cb04ba6f7e942dd"`,
    );
    await queryRunner.query(`DROP TABLE "admins"`);
  }
}
