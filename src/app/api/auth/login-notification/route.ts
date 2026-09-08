import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_LOGIN_NOTIFY_EMAIL = 'support@fsmo-olimp.ru'

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user?.email) {
    return NextResponse.json(
      { error: 'Требуется успешная авторизация' },
      { status: 401 }
    )
  }

  if (!process.env.BREVO_API_KEY) {
    console.error(
      '[login-notification] BREVO_API_KEY is not configured',
      { userId: user.id }
    )
    return NextResponse.json({ skipped: true })
  }

  const loggedInAt = new Date()
  const notifyEmail =
    process.env.LOGIN_NOTIFY_EMAIL || DEFAULT_LOGIN_NOTIFY_EMAIL

  try {
    const emailResponse = await fetch(
      'https://api.brevo.com/v3/smtp/email',
      {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'ФСМО',
            email:
              process.env.BREVO_FROM_EMAIL ||
              'ars2007dm@gmail.com',
          },
          to: [{ email: notifyEmail }],
          subject: 'Успешная авторизация — ФСМО lite',
          textContent: `Email пользователя: ${user.email}\nДата и время входа: ${loggedInAt.toISOString()}\nТип события: успешная авторизация`,
        }),
      }
    )

    if (!emailResponse.ok) {
      const responseBody = await emailResponse.text()
      console.error('[login-notification] Brevo request failed', {
        status: emailResponse.status,
        responseBody,
        userId: user.id,
      })
    }
  } catch (error) {
    console.error('[login-notification] Failed to send email', {
      error,
      userId: user.id,
    })
  }

  return NextResponse.json({ ok: true })
}
