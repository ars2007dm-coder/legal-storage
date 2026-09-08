import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

function randomPassword(): string {
  return `${randomBytes(32).toString('base64url')}Aa1!`
}

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()

  const normalized = normalizeEmail(email || '')

  if (!normalized || !normalized.includes('@')) {
    return NextResponse.json(
      { error: 'Введите корректный email' },
      { status: 400 }
    )
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Введите код' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: otp, error: otpError } = await supabase
    .from('email_otp_codes')
    .select('*')
    .eq('email', normalized)
    .maybeSingle()

  if (otpError) {
    return NextResponse.json(
      { error: 'Ошибка проверки кода: ' + otpError.message },
      { status: 500 }
    )
  }

  if (
    !otp ||
    otp.code !== code ||
    new Date(otp.expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: 'Неверный или просроченный код' },
      { status: 401 }
    )
  }

  await supabase
    .from('email_otp_codes')
    .delete()
    .eq('email', normalized)

  const password = randomPassword()

  const { data: usersData, error: usersError } =
    await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

  if (usersError) {
    return NextResponse.json(
      { error: 'Не удалось проверить пользователя: ' + usersError.message },
      { status: 500 }
    )
  }

  const existing = usersData.users.find(
    (user) =>
      user.email?.toLowerCase() === normalized
  )

  if (existing) {
    const { error } =
      await supabase.auth.admin.updateUserById(
        existing.id,
        {
          password,
          email_confirm: true,
        }
      )

    if (error) {
      return NextResponse.json(
        { error: 'Не удалось войти: ' + error.message },
        { status: 500 }
      )
    }
  } else {
    const { data: created, error } =
      await supabase.auth.admin.createUser({
        email: normalized,
        password,
        email_confirm: true,
      })

    if (error || !created.user) {
      return NextResponse.json(
        {
          error:
            'Не удалось создать пользователя: ' +
            (error?.message ?? ''),
        },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({
    ok: true,
    email: normalized,
    password,
  })
}
