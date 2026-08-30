-- =====================================================================
-- ФСМО lite — SQL-скрипт v5: проверенные ссылки на основные кодексы РФ
-- Выполнить ПОСЛЕ v3 и v4.
-- Supabase → SQL Editor → New query → вставить весь файл → Run
--
-- Что делает: добавляет уникальность по полю abbr (чтобы не было
-- дублей), затем "заливает" 15 основных кодексов РФ с ПРОВЕРЕННЫМИ
-- ссылками на consultant.ru — если запись с таким abbr уже есть,
-- она ОБНОВИТ её ссылку/статус/категорию; если записи нет — создаст.
-- Все ссылки проверены на 21.08.2026.
-- =====================================================================

-- Уникальность по аббревиатуре, чтобы ON CONFLICT ниже работал
DO $$ BEGIN
  ALTER TABLE refs ADD CONSTRAINT refs_abbr_unique UNIQUE (abbr);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO refs (doc_type, title, abbr, status, official_url, category, year) VALUES
  ('federal_law', 'Конституция Российской Федерации', 'Конституция РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_28399/', 'constitutional', 1993),
  ('code', 'Гражданский кодекс Российской Федерации (часть первая)', 'ГК РФ ч.1', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_5142/', 'civil', 1994),
  ('code', 'Гражданский кодекс Российской Федерации (часть вторая)', 'ГК РФ ч.2', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_9027/', 'civil', 1996),
  ('code', 'Гражданский кодекс Российской Федерации (часть четвёртая)', 'ГК РФ ч.4', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_64629/', 'civil', 2006),
  ('code', 'Уголовный кодекс Российской Федерации', 'УК РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_10699/', 'criminal', 1996),
  ('code', 'Уголовно-процессуальный кодекс Российской Федерации', 'УПК РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_34481/', 'process', 2001),
  ('code', 'Кодекс Российской Федерации об административных правонарушениях', 'КоАП РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_34661/', 'admin', 2001),
  ('code', 'Налоговый кодекс Российской Федерации (часть первая)', 'НК РФ ч.1', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_19671/', 'tax', 1998),
  ('code', 'Налоговый кодекс Российской Федерации (часть вторая)', 'НК РФ ч.2', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_28165/', 'tax', 2000),
  ('code', 'Трудовой кодекс Российской Федерации', 'ТК РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_34683/', 'labor', 2001),
  ('code', 'Семейный кодекс Российской Федерации', 'СК РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_8982/', 'family', 1995),
  ('code', 'Земельный кодекс Российской Федерации', 'ЗК РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_33773/', 'land', 2001),
  ('code', 'Гражданский процессуальный кодекс Российской Федерации', 'ГПК РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_39570/', 'process', 2002),
  ('code', 'Арбитражный процессуальный кодекс Российской Федерации', 'АПК РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_37800/', 'process', 2002),
  ('code', 'Жилищный кодекс Российской Федерации', 'ЖК РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_51057/', 'civil', 2004)
ON CONFLICT (abbr) DO UPDATE SET
  official_url = EXCLUDED.official_url,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  doc_type = EXCLUDED.doc_type,
  title = EXCLUDED.title;

-- =====================================================================
-- Проверка:
-- SELECT abbr, official_url FROM refs WHERE abbr IN
--   ('Конституция РФ','ГК РФ ч.1','УК РФ','АПК РФ','НК РФ ч.1')
--   ORDER BY abbr;
-- Откройте несколько ссылок вручную — все должны вести на нужный кодекс.
-- =====================================================================
