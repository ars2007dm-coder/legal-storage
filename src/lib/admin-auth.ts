import { cookies } from 'next/headers'

// Простая защита админки: пароль хранится в переменной окружения
// ADMIN_PASSWORD (только на сервере, без NEXT_PUBLIC_), при успешном
// входе ставится cookie. Это не банковский уровень защиты, но для
// небольшого учебного проекта — достаточно, пока не нужен полноценный
// Supabase Auth с ролями.

export const ADMIN_COOKIE = 'fsmo_admin_session'

export function isAdmin(): boolean {
  const cookieStore = cookies()
  return cookieStore.get(ADMIN_COOKIE)?.value === 'granted'
}
