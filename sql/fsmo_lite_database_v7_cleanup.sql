-- =====================================================================
-- ФСМО lite — SQL-скрипт v7: чистка дублей и исправление ссылок,
-- которые не входили в v5/v6 (достались от исходных данных проекта).
-- Проверено вручную через поиск на КонсультантПлюс, 22.08.2026.
-- Supabase → SQL Editor → New query → вставить весь файл → Run
-- =====================================================================

-- 1. Исправление неверных ссылок
UPDATE refs SET official_url = 'https://www.consultant.ru/document/cons_doc_LAW_34154/'
WHERE abbr = 'ГК РФ ч.3';

UPDATE refs SET official_url = 'https://www.consultant.ru/document/cons_doc_LAW_60683/'
WHERE abbr = 'ВК РФ';

UPDATE refs SET official_url = 'https://www.consultant.ru/document/cons_doc_LAW_22916/'
WHERE abbr = 'КТМ РФ';

UPDATE refs SET official_url = 'https://www.consultant.ru/document/cons_doc_LAW_12940/'
WHERE abbr = 'УИК РФ';

-- 2. "Таможенный кодекс РФ" в старом виде больше не действует —
-- заменяем на актуальный Таможенный кодекс ЕАЭС
UPDATE refs SET
  title = 'Таможенный кодекс Евразийского экономического союза',
  abbr = 'ТК ЕАЭС',
  official_url = 'https://www.consultant.ru/document/cons_doc_LAW_215315/',
  year = 2017
WHERE abbr = 'Таможенный кодекс РФ';

-- 3. Убираем дубль Лесного кодекса (одна и та же ссылка под двумя записями)
DELETE FROM refs WHERE abbr = 'ЛК РФ (ред.)';

-- 4. Убираем устаревшую запись "НК РФ" без указания части —
-- теперь есть отдельные, правильные "НК РФ ч.1" и "НК РФ ч.2"
DELETE FROM refs WHERE abbr = 'НК РФ';

-- =====================================================================
-- Проверка:
-- SELECT title, abbr, official_url FROM refs ORDER BY title;
-- SELECT count(*) FROM refs;  -- должно стать 36 (было 38, минус 2 удалённые)
-- =====================================================================
