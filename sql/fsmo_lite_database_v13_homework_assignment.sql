-- v13_homework_assignment.sql
-- Назначение ДЗ конкретному ученику (по номеру телефона).
-- Если assigned_phone = NULL — задание видят все ученики (как сейчас).
-- Если указан конкретный номер — только этот ученик.

ALTER TABLE homework ADD COLUMN IF NOT EXISTS assigned_phone text;

-- Пересоздаём view с тем же набором открытых колонок + новая колонка.
-- model_answer по-прежнему не включён — ученики его не видят.
CREATE OR REPLACE VIEW homework_public AS
SELECT id, title, instructions, category, created_at, assigned_phone
FROM homework;

-- Проверка:
-- SELECT id, title, assigned_phone FROM homework;
