-- Preserve prototype data while replacing its schema with the GovAssist ticket domain.
ALTER TABLE "prompts" RENAME TO "legacy_prompt_audits";
ALTER TABLE "users" RENAME TO "legacy_users";
ALTER TABLE "legacy_users" RENAME CONSTRAINT "users_pkey" TO "legacy_users_pkey";

CREATE TYPE "user_role" AS ENUM ('OFFICER', 'ADMIN');
CREATE TYPE "ticket_category" AS ENUM ('MBG', 'INFRASTRUCTURE', 'GENERAL');
CREATE TYPE "ticket_status" AS ENUM ('RECEIVED', 'VERIFIED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE "organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" INTEGER,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tickets" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "reporter_id" INTEGER,
    "title" TEXT,
    "category" "ticket_category" NOT NULL,
    "description" TEXT NOT NULL,
    "transcript" TEXT,
    "speech_url" TEXT NOT NULL,
    "location" TEXT,
    "status" "ticket_status" NOT NULL DEFAULT 'RECEIVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attachments" (
    "id" SERIAL NOT NULL,
    "tickets_id" INTEGER NOT NULL,
    "attachment_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "replies" (
    "id" SERIAL NOT NULL,
    "tickets_id" INTEGER NOT NULL,
    "replied_by" INTEGER NOT NULL,
    "reply_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "replies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_activities" (
    "id" SERIAL NOT NULL,
    "tickets_id" INTEGER NOT NULL,
    "actor_id" INTEGER,
    "from_status" "ticket_status" NOT NULL,
    "to_status" "ticket_status" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_activities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tickets_public_id_key" ON "tickets"("public_id");
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");
CREATE INDEX "tickets_reporter_id_idx" ON "tickets"("reporter_id");
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at");
CREATE INDEX "tickets_status_idx" ON "tickets"("status");
CREATE INDEX "attachments_tickets_id_idx" ON "attachments"("tickets_id");
CREATE INDEX "replies_tickets_id_idx" ON "replies"("tickets_id");
CREATE INDEX "replies_replied_by_idx" ON "replies"("replied_by");
CREATE INDEX "ticket_activities_tickets_id_idx" ON "ticket_activities"("tickets_id");
CREATE INDEX "ticket_activities_actor_id_idx" ON "ticket_activities"("actor_id");

ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_tickets_id_fkey" FOREIGN KEY ("tickets_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "replies" ADD CONSTRAINT "replies_tickets_id_fkey" FOREIGN KEY ("tickets_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "replies" ADD CONSTRAINT "replies_replied_by_fkey" FOREIGN KEY ("replied_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_tickets_id_fkey" FOREIGN KEY ("tickets_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
