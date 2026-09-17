ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;

ALTER TABLE "attachments"
ADD COLUMN IF NOT EXISTS "reply_id" INTEGER;

ALTER TABLE "attachments"
ALTER COLUMN "tickets_id" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "attachments_reply_id_idx"
ON "attachments"("reply_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'attachments_reply_id_fkey'
    ) THEN
        ALTER TABLE "attachments"
        ADD CONSTRAINT "attachments_reply_id_fkey"
        FOREIGN KEY ("reply_id") REFERENCES "replies"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'attachments_owner_check'
    ) THEN
        ALTER TABLE "attachments"
        ADD CONSTRAINT "attachments_owner_check"
        CHECK (
            ("tickets_id" IS NOT NULL AND "reply_id" IS NULL)
            OR ("tickets_id" IS NULL AND "reply_id" IS NOT NULL)
        );
    END IF;
END $$;

UPDATE "users"
SET "avatar_url" = 'https://baa.unas.ac.id/wp-content/uploads/2013/07/logo-unas.png'
WHERE "id" = 1 AND "avatar_url" IS NULL;
