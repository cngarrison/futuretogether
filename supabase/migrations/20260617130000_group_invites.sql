-- Group invite tokens (single-use, 7-day expiry)
CREATE TABLE IF NOT EXISTS group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  email text,                          -- optional: pre-filled recipient email
  created_by_id uuid REFERENCES profiles(id),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,                 -- set when token is redeemed
  used_by_id uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_invites_token ON group_invites(token);
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON group_invites(group_id);

-- RLS: service role only (all operations go via admin client)
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;
-- No policies needed — only accessible via createAdminClient()

-- GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_invites TO authenticated;
GRANT ALL ON TABLE public.group_invites    TO service_role;
