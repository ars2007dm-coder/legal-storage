-- v11_favorites_homework.sql
-- Разрешаем сохранять в избранное домашние задания (item_type = 'homework')

DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'favorites'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%item_type%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE favorites DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE favorites
  ADD CONSTRAINT favorites_item_type_check
  CHECK (item_type IN ('ref', 'book', 'task', 'homework'));

-- Проверка:
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'favorites'::regclass;
