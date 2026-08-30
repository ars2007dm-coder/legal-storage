-- =====================================================================
-- ФСМО lite — SQL-скрипт v6: расширение базы НПА
-- Добавляет: ещё 3 кодекса, 7 федеральных законов, 2 ФКЗ,
-- 3 постановления Пленума Верховного Суда (ППВС).
-- Все ссылки проверены вручную через поиск на КонсультантПлюс
-- (актуально на 21.08.2026). Работает так же, как v5:
-- если запись с такой abbr уже есть — обновит, если нет — создаст.
-- Выполнить ПОСЛЕ v5. Supabase → SQL Editor → New query → Run.
-- =====================================================================

INSERT INTO refs (doc_type, title, abbr, status, official_url, category, year) VALUES

  -- Ещё кодексы
  ('code', 'Бюджетный кодекс Российской Федерации', 'БК РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_19702/', 'tax', 1998),
  ('code', 'Градостроительный кодекс Российской Федерации', 'ГрК РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_51040/', 'land', 2004),
  ('code', 'Кодекс административного судопроизводства Российской Федерации', 'КАС РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_176147/', 'process', 2015),

  -- Ключевые федеральные законы
  ('federal_law', 'Федеральный закон "О персональных данных"', '152-ФЗ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_61801/', 'civil', 2006),
  ('federal_law', 'Закон РФ "О защите прав потребителей"', 'Закон о защите прав потребителей', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_305/', 'civil', 1992),
  ('federal_law', 'Федеральный закон "Об обществах с ограниченной ответственностью"', '14-ФЗ (ООО)', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_17819/', 'business', 1998),
  ('federal_law', 'Федеральный закон "Об акционерных обществах"', '208-ФЗ (АО)', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_8743/', 'business', 1995),
  ('federal_law', 'Федеральный закон "О несостоятельности (банкротстве)"', '127-ФЗ (банкротство)', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_39331/', 'business', 2002),
  ('federal_law', 'Федеральный закон "О полиции"', '3-ФЗ (полиция)', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_110165/', 'admin', 2011),
  ('federal_law', 'Федеральный закон "О прокуратуре Российской Федерации"', 'О прокуратуре РФ', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_262/', 'process', 1992),

  -- Федеральные конституционные законы
  ('federal_law', 'Федеральный конституционный закон "О Конституционном Суде Российской Федерации"', '1-ФКЗ (КС РФ)', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_4172/', 'constitutional', 1994),
  ('federal_law', 'Федеральный конституционный закон "О судебной системе Российской Федерации"', '1-ФКЗ (судебная система)', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_12834/', 'constitutional', 1996),

  -- Постановления Пленума Верховного Суда РФ
  ('plenum', 'Постановление Пленума ВС РФ "О применении судами некоторых положений раздела I части первой ГК РФ"', 'ППВС №25', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_181602/', 'civil', 2015),
  ('plenum', 'Постановление Пленума ВС РФ "О практике назначения судами Российской Федерации уголовного наказания"', 'ППВС №58', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_190932/', 'criminal', 2015),
  ('plenum', 'Постановление Пленума ВС РФ "О практике применения судами норм о компенсации морального вреда"', 'ППВС №33', 'active', 'https://www.consultant.ru/document/cons_doc_LAW_431485/', 'civil', 2022)

ON CONFLICT (abbr) DO UPDATE SET
  official_url = EXCLUDED.official_url,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  doc_type = EXCLUDED.doc_type,
  title = EXCLUDED.title;

-- =====================================================================
-- Проверка: должно стать 15 (из v5) + 15 (это) = 30 записей в refs
-- SELECT count(*) FROM refs;
-- SELECT abbr, doc_type, official_url FROM refs ORDER BY doc_type, abbr;
-- =====================================================================
