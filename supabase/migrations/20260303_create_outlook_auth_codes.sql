-- Outlook Add-in authentication codes table
CREATE TABLE outlook_auth_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_outlook_auth_codes_email ON outlook_auth_codes(email, used, expires_at);

ALTER TABLE outlook_auth_codes ENABLE ROW LEVEL SECURITY;

-- No user-facing RLS policies; only admin/service role client accesses this table
