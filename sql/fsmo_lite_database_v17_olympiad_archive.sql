-- ФСМО lite — v17: каталог олимпиадных материалов по внешним официальным ссылкам.
-- Не загружает и не хранит чужие PDF: файлы открываются только у правообладателя.
-- Выполнять в Supabase SQL Editor после предыдущих миграций.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS grade smallint;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_name text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS answers_url text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS external_only boolean NOT NULL DEFAULT false;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_grade_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_grade_check CHECK (grade IS NULL OR grade BETWEEN 5 AND 11);

-- Защита от повторного добавления одного и того же файла.
CREATE UNIQUE INDEX IF NOT EXISTS tasks_source_url_unique
  ON tasks (source_url)
  WHERE source_url IS NOT NULL;

COMMENT ON COLUMN tasks.source_url IS 'Прямая официальная ссылка на файл задания';
COMMENT ON COLUMN tasks.answers_url IS 'Прямая официальная ссылка на ответы или критерии';
COMMENT ON COLUMN tasks.external_only IS 'Текст/файл не дублируется на ФСМО';
