import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '+7' + digits.slice(1)
  }
  if (digits.length === 10) return '+7' + digits
  return '+' + digits
}

function randomPassword(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + 'Aa1!'
}

// Письмо администратору о том, что кто-то вошёл по телефону. Тихо
// ничего не делает, если RESEND_API_KEY / ADMIN_EMAIL не настроены —
// как и в /api/notify-request, это не должно ломать сам вход.
async function notifyLogin(phone: string, isNew: boolean) {
  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ФСМО lite <onboarding@resend.dev>',
        to: [process.env.ADMIN_EMAIL],
        subject: isNew ? 'Новая регистрация — ФСМО lite' : 'Вход на сайт — ФСМО lite',
        text: isNew
          ? `Зарегистрировался новый пользователь.\n\nТелефон: ${phone}`
          : `Вход по телефону.\n\nТелефон: ${phone}`,
      }),
    })
  } catch {
    // намеренно игнорируем — уведомление не должно ломать вход
  }
}

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json()
  const normalized = normalizePhone(phone || '')

  if (!code) {
    return NextResponse.json({ error: 'Введите код' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: otp } = await supabase
    .from('phone_otp_codes')
    .select('*')
    .eq('phone', normalized)
    .maybeSingle()

  if (!otp || otp.code !== code || new Date(otp.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Неверный или просроченный код' }, { status: 401 })
  }

  // код использован — удаляем, чтобы нельзя было применить повторно
  await supabase.from('phone_otp_codes').delete().eq('phone', normalized)

  const password = randomPassword()

  const { data: existing } = await supabase
    .from('phone_accounts')
    .select('user_id')
    .eq('phone', normalized)
    .maybeSingle()

  let isNew = false

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.user_id, { password })
    if (error) {
      return NextResponse.json({ error: 'Не удалось войти: ' + error.message }, { status: 500 })
    }
  } else {
    isNew = true
    const { data: created, error } = await supabase.auth.admin.createUser({
      phone: normalized,
      password,
      phone_confirm: true,
    })
    if (error || !created.user) {
      return NextResponse.json(
        { error: 'Не удалось создать пользователя: ' + (error?.message ?? '') },
        { status: 500 }
      )
    }
    await supabase.from('phone_accounts').insert({ phone: normalized, user_id: created.user.id })
  }

  // Уведомление админу — не ждём ответа, чтобы не задерживать вход
  notifyLogin(normalized, isNew).catch(() => {})

  // Пароль отдаём клиенту только для немедленного использования —
  // он тут же вызывает signInWithPassword и получает настоящую сессию
  return NextResponse.json({ ok: true, phone: normalized, password })
}
