-- Audit log table for tracking consequential admin actions.
-- Covers both platform admins (/admin/) and group admins (/groups/[slug]/admin/).
-- Append-only: no UPDATE or DELETE policies.

CREATE TABLE audit_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      uuid        NOT NULL REFERENCES profiles(id),
  actor_role    text        NOT NULL
                              CHECK (actor_role IN ('site_owner','site_admin','group_owner','group_admin')),
  action        text        NOT NULL,   -- dot-namespaced, e.g. 'event.published'
  resource_type text        NOT NULL,   -- 'group'|'event'|'program'|'member'|'email'|'settings'
  resource_id   uuid,                   -- affected row id (nullable)
  resource_slug text,                   -- human-readable identifier for UI (nullable)
  group_id      uuid        REFERENCES groups(id),
  metadata      jsonb,                  -- action-specific detail blob
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes for the expected query patterns
CREATE INDEX audit_logs_actor_id_idx    ON audit_logs (actor_id);
CREATE INDEX audit_logs_group_id_idx    ON audit_logs (group_id);
CREATE INDEX audit_logs_action_idx      ON audit_logs (action);
CREATE INDEX audit_logs_created_at_idx  ON audit_logs (created_at DESC);

--GRANT INSERT ON TABLE public.audit_logs TO anon;
GRANT SELECT, INSERT ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- INSERT: authenticated users may only insert rows where they are the actor.
-- All admin actions are server-side, so this is safe without the service role key.
CREATE POLICY "Authenticated users can insert own audit entries"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- SELECT: platform admins see all rows.
CREATE POLICY "Platform admins can read all audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_platform_roles
      WHERE profile_id = auth.uid()
        AND role IN ('site_owner', 'site_admin')
    )
  );

-- SELECT: group admins see only their group's rows.
CREATE POLICY "Group admins can read their group audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM group_memberships
      WHERE profile_id = auth.uid()
        AND group_id = audit_logs.group_id
        AND role IN ('group_owner', 'group_admin')
        AND status = 'active'
    )
  );

-- No UPDATE or DELETE policies — audit log is immutable.
