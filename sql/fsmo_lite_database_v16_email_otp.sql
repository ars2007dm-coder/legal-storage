-- Одноразовые email-коды для авторизации.
-- Доступ разрешён только серверному service_role.

CREATE TABLE IF NOT EXISTS public.email_otp_codes (
  email text PRIMARY KEY,
  code text NOT NULL CHECK (code ~ '^[0-9]{6}$'),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_otp_codes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.email_otp_codes FROM anon, authenticated;
GRANT ALL ON TABLE public.email_otp_codes TO service_role;

CREATE INDEX IF NOT EXISTS email_otp_codes_expires_at_idx
  ON public.email_otp_codes (expires_at);
