import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomInt } from 'crypto'

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

function generateCode(): string {
  return randomInt(100000, 1000000).toString()
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const normalized = normalizeEmail(email || '')

  if (!normalized || !normalized.includes('@')) {
    return NextResponse.json(
      { error: 'Введите корректный email' },
      { status: 400 }
    )
  }

  if (!process.env.BREVO_API_KEY) {
    return NextResponse.json(
      { error: 'Не указан BREVO_API_KEY' },
      { status: 500 }
    )
  }

  const code = generateCode()
  const supabase = createAdminClient()

  const { error: dbError } = await supabase
    .from('email_otp_codes')
    .upsert({
      email: normalized,
      code,
      expires_at: new Date(
        Date.now() + 10 * 60 * 1000
      ).toISOString(),
    })

  if (dbError) {
    return NextResponse.json(
      { error: 'Ошибка базы данных: ' + dbError.message },
      { status: 500 }
    )
  }

  try {
    const emailRes = await fetch(
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
            email: process.env.BREVO_FROM_EMAIL || 'ars2007dm@gmail.com',
          },
          to: [{ email: normalized }],
          subject: 'Код подтверждения — ФСМО lite',
          textContent: `Здравствуйте!

Вас приветствует ФСМО | Фонд систематизированных методик образования.

Благодарим за проявленный интерес к платформе FSMO lite.

Ваш код подтверждения: ${code}

Код действителен в течение 10 минут.

Желаем комфортной подготовки и ждём Вас в нашей олимпиадной команде!

С уважением,
ФСМО | Фонд систематизированных методик образования`,
        }),
      }
    )

    if (!emailRes.ok) {
      const text = await emailRes.text()

      await supabase
        .from('email_otp_codes')
        .delete()
        .eq('email', normalized)

      return NextResponse.json(
        { error: 'Не удалось отправить письмо: ' + text },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Ошибка отправки письма: ' + e.message },
      { status: 500 }
    )
  }
}
