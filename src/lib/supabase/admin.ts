import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Клиент с service role key — используется ТОЛЬКО в серверном коде
// (Route Handlers, Server Actions), никогда не импортировать в 'use client'
// компоненты. Обходит RLS — поэтому вызывается только после проверки
// админ-сессии (см. isAdmin() в src/lib/admin-auth.ts).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
