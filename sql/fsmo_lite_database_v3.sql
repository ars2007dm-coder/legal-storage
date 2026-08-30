-- =====================================================================
-- ФСМО lite — SQL-скрипт v3 (полный, безопасно выполнять повторно)
-- Как выполнить: Supabase → SQL Editor → New query → вставить весь файл → Run
-- =====================================================================

-- 1. ИСПРАВЛЕНИЕ ССЫЛОК: http:// -> https:// в таблице refs
UPDATE refs
SET official_url = REPLACE(official_url, 'http://', 'https://')
WHERE official_url LIKE 'http://%';

-- =====================================================================
-- 2. НОВЫЕ ТАБЛИЦЫ: profiles, folders, favorites
-- =====================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  grade text,
  phone text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  item_type text NOT NULL CHECK (item_type IN ('ref', 'book', 'task')),
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

-- =====================================================================
-- 3. RLS: защита персональных таблиц (каждый видит только своё)
-- =====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "folders_all_own" ON folders;
CREATE POLICY "folders_all_own" ON folders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_all_own" ON favorites;
CREATE POLICY "favorites_all_own" ON favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- 4. RLS для справочных таблиц — чтение разрешено всем (даже без входа)
-- =====================================================================

ALTER TABLE refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_refs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "refs_public_read" ON refs;
CREATE POLICY "refs_public_read" ON refs FOR SELECT USING (true);

DROP POLICY IF EXISTS "tasks_public_read" ON tasks;
CREATE POLICY "tasks_public_read" ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "books_public_read" ON books;
CREATE POLICY "books_public_read" ON books FOR SELECT USING (true);

DROP POLICY IF EXISTS "videos_public_read" ON videos;
CREATE POLICY "videos_public_read" ON videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "task_refs_public_read" ON task_refs;
CREATE POLICY "task_refs_public_read" ON task_refs FOR SELECT USING (true);

-- =====================================================================
-- 5. Функция глобального поиска: global_search(query_text)
-- Используется страницей /search
-- =====================================================================

CREATE OR REPLACE FUNCTION global_search(query_text text)
RETURNS TABLE (
  item_type text,
  id uuid,
  title text,
  subtitle text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 'ref'::text AS item_type, refs.id, refs.title, COALESCE(refs.abbr, '') AS subtitle
  FROM refs
  WHERE refs.title ILIKE '%' || query_text || '%' OR refs.abbr ILIKE '%' || query_text || '%'

  UNION ALL

  SELECT 'book'::text, books.id, books.title, COALESCE(books.author, '')
  FROM books
  WHERE books.title ILIKE '%' || query_text || '%' OR books.author ILIKE '%' || query_text || '%'

  UNION ALL

  SELECT 'task'::text, tasks.id, tasks.title, COALESCE(tasks.preview, '')
  FROM tasks
  WHERE tasks.title ILIKE '%' || query_text || '%' OR tasks.preview ILIKE '%' || query_text || '%'

  LIMIT 50;
$$;

-- =====================================================================
-- Готово. Проверка:
-- SELECT * FROM global_search('право');
-- SELECT official_url FROM refs LIMIT 5;  -- все должны быть https://
-- =====================================================================
