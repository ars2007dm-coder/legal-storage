-- v14_backfill_profiles.sql
-- Создаёт строку в profiles для каждого пользователя, у которого её
-- ещё нет (аккаунты, созданные до появления личного кабинета).
-- Безопасно выполнять повторно — ON CONFLICT DO NOTHING.

INSERT INTO profiles (id)
SELECT u.id
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Проверка — должно вернуть 0 строк:
-- SELECT u.id FROM auth.users u LEFT JOIN profiles p ON p.id = u.id WHERE p.id IS NULL;
