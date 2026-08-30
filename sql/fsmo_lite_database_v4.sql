-- =====================================================================
-- ФСМО lite — SQL-скрипт v4: заявки на доступ, домашние задания, админ
-- Выполнить ПОСЛЕ v3 (или вместо него, если v3 ещё не выполняли — этот
-- скрипт не трогает то, что было в v3, только добавляет новое)
-- Supabase → SQL Editor → New query → вставить весь файл → Run
-- =====================================================================

-- =====================================================================
-- 0. Добавляем поле "категория" книгам (нужно для формы в админке)
-- =====================================================================

ALTER TABLE books ADD COLUMN IF NOT EXISTS category text;

-- =====================================================================
-- 1. ЗАЯВКИ НА ДОСТУП (вместо SMS — ручное одобрение админом)
-- =====================================================================

CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  grade text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  access_code text,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Любой может ОТПРАВИТЬ заявку, но не может сразу выставить себе
-- статус "approved" или код доступа — это делает только админ
DROP POLICY IF EXISTS "access_requests_insert_pending" ON access_requests;
CREATE POLICY "access_requests_insert_pending" ON access_requests
  FOR INSERT WITH CHECK (status = 'pending' AND access_code IS NULL);

-- Читать/менять таблицу напрямую через анонимный ключ нельзя —
-- админка работает через service role key (в обход RLS),
-- а ученик проверяет код через функцию ниже, не через прямой SELECT

CREATE OR REPLACE FUNCTION verify_access_code(p_phone text, p_code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM access_requests
    WHERE phone = p_phone AND access_code = p_code AND status = 'approved'
  );
$$;

GRANT EXECUTE ON FUNCTION verify_access_code(text, text) TO anon, authenticated;

-- =====================================================================
-- 2. ДОМАШНИЕ ЗАДАНИЯ
-- =====================================================================

CREATE TABLE IF NOT EXISTS homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  instructions text NOT NULL,
  model_answer text NOT NULL,  -- эталон/критерии для ИИ-проверки, ученику не показывается
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
-- Прямого доступа к таблице homework у анонимного ключа нет (в т.ч. к model_answer).
-- Ученики читают через отдельное представление ниже, без поля model_answer.

CREATE OR REPLACE VIEW homework_public AS
  SELECT id, title, instructions, category, created_at FROM homework;

GRANT SELECT ON homework_public TO anon, authenticated;

CREATE TABLE IF NOT EXISTS homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
  phone text NOT NULL,
  answer_text text NOT NULL,
  ai_feedback text,
  ai_score text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
-- Запись только через серверный маршрут (/api/check-homework) с service role key.
-- Никаких политик для anon не создаём — прямая запись/чтение анонимным ключом закрыта.

-- =====================================================================
-- Готово. Проверка:
-- SELECT * FROM homework_public;
-- SELECT verify_access_code('+79990000000', '123456');  -- false, пока нет одобренных заявок
-- =====================================================================
