-- Seed the organization and staff actor used by authenticated admin activity.
INSERT INTO "organization" ("name", "created_at", "updated_at")
SELECT 'UNAS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "organization" WHERE UPPER("name") = 'UNAS'
);

INSERT INTO "users" ("id", "name", "organization_id", "role", "created_at", "updated_at")
VALUES (
    1,
    'Admin GovAssist',
    (SELECT "id" FROM "organization" WHERE UPPER("name") = 'UNAS' ORDER BY "id" LIMIT 1),
    'ADMIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "organization_id" = EXCLUDED."organization_id",
    "role" = EXCLUDED."role",
    "updated_at" = CURRENT_TIMESTAMP;

SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "users"), 1),
    true
);
