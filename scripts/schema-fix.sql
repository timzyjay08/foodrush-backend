-- Keep existing databases aligned with src/db/schema.ts. These statements are
-- safe to run repeatedly and preserve existing data.
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS google_id text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique
  ON users (google_id)
  WHERE google_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_logs (
  id serial PRIMARY KEY,
  actor_id integer REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  metadata jsonb,
  ip text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'open',
  order_id integer REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Older deployments used UUID support tickets/users. Do not abort the whole
-- repair when that schema is present; the application migration for that
-- deployment must create its matching message table separately.
DO $$
DECLARE
  ticket_id_type text;
BEGIN
  IF to_regclass('public.support_messages') IS NULL THEN
    SELECT format_type(a.atttypid, a.atttypmod)
      INTO ticket_id_type
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'support_tickets'
       AND a.attname = 'id'
       AND NOT a.attisdropped;

    IF ticket_id_type = 'integer' THEN
      CREATE TABLE support_messages (
        id serial PRIMARY KEY,
        ticket_id integer NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body text NOT NULL,
        created_at timestamptz DEFAULT now()
      );
    ELSE
      RAISE NOTICE 'Skipping support_messages: support_tickets.id is %, not integer', ticket_id_type;
    END IF;
  END IF;
END $$;
