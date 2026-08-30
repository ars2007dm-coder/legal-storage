-- v12_announcements_deadlines.sql
-- Доска объявлений на главной + календарь дедлайнов в админке

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  deadline_date date NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

-- Читать может кто угодно (даже без входа) — доска на главной публичная
DROP POLICY IF EXISTS "announcements_public_read" ON announcements;
CREATE POLICY "announcements_public_read" ON announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "deadlines_public_read" ON deadlines;
CREATE POLICY "deadlines_public_read" ON deadlines FOR SELECT USING (true);

-- Запись/удаление — только через админку (server actions используют
-- service role ключ, который обходит RLS, как и для остальных таблиц:
-- refs, books, tasks, videos), поэтому отдельная write-политика не нужна.

-- Проверка:
-- SELECT * FROM announcements;
-- SELECT * FROM deadlines ORDER BY deadline_date;
