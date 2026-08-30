-- v10_account.sql
-- Личный кабинет: аватар, ФИО, класс

-- Добавляем поля в profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS student_class text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Бакет для аватарок
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Политика: пользователь может обновлять свой профиль
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Политики для загрузки/чтения аватарок
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Avatars are publicly readable') THEN
    CREATE POLICY "Avatars are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload own avatar') THEN
    CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update own avatar') THEN
    CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE
      USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- На всякий случай: строка в profiles создаётся автоматически при регистрации
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
