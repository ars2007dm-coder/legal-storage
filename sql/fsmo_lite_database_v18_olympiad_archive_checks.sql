-- ФСМО lite — v18: разрешить архивные этапы и категорию прочих олимпиад.
-- Выполнять после fsmo_lite_database_v17_olympiad_archive.sql.

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_stage_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_stage_check
  CHECK (stage = ANY (ARRAY['school', 'municipal', 'regional', 'federal', 'final', 'archive']));

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_category_check
  CHECK (category = ANY (ARRAY['constitutional', 'civil', 'criminal', 'admin', 'process', 'tax', 'labor', 'family', 'land', 'business', 'other']));
