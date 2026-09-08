-- Telegram-бот преподавателей: черновики пошаговой формы и финальные заявки.
-- Обе таблицы доступны только серверу через SUPABASE_SERVICE_ROLE_KEY.

CREATE TABLE IF NOT EXISTS teacher_homework_drafts (
  telegram_user_id bigint PRIMARY KEY,
  step text NOT NULL CHECK (step IN (
    'subject', 'student_group', 'assignment_text', 'deadline',
    'comment', 'attachment', 'confirmation'
  )),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teacher_homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_update_id bigint UNIQUE,
  telegram_user_id bigint NOT NULL,
  telegram_username text,
  teacher_name text NOT NULL,
  subject text NOT NULL,
  student_group text NOT NULL,
  assignment_text text NOT NULL,
  deadline text,
  comment text,
  file_type text CHECK (file_type IS NULL OR file_type IN ('photo', 'document')),
  file_id text,
  file_unique_id text,
  file_name text,
  file_mime_type text,
  file_size bigint,
  admin_message_id bigint,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'added', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by_telegram_user_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teacher_homework_submissions_status_created_idx
  ON teacher_homework_submissions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS teacher_homework_submissions_teacher_created_idx
  ON teacher_homework_submissions (telegram_user_id, created_at DESC);

ALTER TABLE teacher_homework_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_homework_submissions ENABLE ROW LEVEL SECURITY;

-- Политики намеренно не создаются: anon/authenticated не получают доступ.
-- Service role на сервере обходит RLS.

REVOKE ALL ON TABLE teacher_homework_drafts FROM anon, authenticated;
REVOKE ALL ON TABLE teacher_homework_submissions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION set_teacher_homework_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS teacher_homework_drafts_updated_at ON teacher_homework_drafts;
CREATE TRIGGER teacher_homework_drafts_updated_at
BEFORE UPDATE ON teacher_homework_drafts
FOR EACH ROW EXECUTE FUNCTION set_teacher_homework_updated_at();

DROP TRIGGER IF EXISTS teacher_homework_submissions_updated_at ON teacher_homework_submissions;
CREATE TRIGGER teacher_homework_submissions_updated_at
BEFORE UPDATE ON teacher_homework_submissions
FOR EACH ROW EXECUTE FUNCTION set_teacher_homework_updated_at();
