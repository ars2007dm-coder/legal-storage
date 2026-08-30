-- =====================================================================
-- ФСМО lite — SQL-скрипт v9: вход по SMS через SMS.ru
-- Добавляет служебные таблицы для своей системы кодов (не зависит
-- от Twilio — SMS отправляются напрямую через SMS.ru).
-- Supabase → SQL Editor → New query → вставить весь файл → Run
-- =====================================================================

-- Временные коды подтверждения (живут 5 минут, потом не действительны)
CREATE TABLE IF NOT EXISTS phone_otp_codes (
  phone text PRIMARY KEY,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE phone_otp_codes ENABLE ROW LEVEL SECURITY;
-- Политик для anon нет намеренно — доступ только через service role (сервер)

-- Связка "номер телефона -> пользователь Supabase Auth"
-- (нужна, чтобы при повторном входе не плодить новых пользователей)
CREATE TABLE IF NOT EXISTS phone_accounts (
  phone text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE phone_accounts ENABLE ROW LEVEL SECURITY;
