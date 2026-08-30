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

// Используем "авторизацию по звонку" SMS.ru вместо SMS-сообщения —
// не требует регистрации буквенного имени отправителя (которая
// доступна только юрлицам и занимает 3-7 дней). Пользователю звонят
// с рандомного номера, последние 4 цифры этого номера — код.
export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  const normalized = normalizePhone(phone || '')

  if (normalized.replace(/\D/g, '').length < 11) {
    return NextResponse.json({ error: 'Введите корректный номер телефона' }, { status: 400 })
  }

  if (!process.env.SMSRU_API_ID) {
    return NextResponse.json(
      { error: 'SMS.ru не настроен на сервере (нет SMSRU_API_ID)' },
      { status: 500 }
    )
  }

  const phoneDigits = normalized.replace('+', '')
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'

  let code: string
  try {
    const callRes = await fetch('https://sms.ru/code/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        phone: phoneDigits,
        ip: clientIp,
        api_id: process.env.SMSRU_API_ID,
      }),
    })
    const callData = await callRes.json()

    if (callData.status !== 'OK' || !callData.code) {
      return NextResponse.json(
        { error: 'Не удалось позвонить: ' + (callData.status_text || 'неизвестная ошибка') },
        { status: 500 }
      )
    }
    code = callData.code
  } catch (e: any) {
    return NextResponse.json({ error: 'Ошибка соединения с SMS.ru: ' + e.message }, { status: 500 })
  }

  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from('phone_otp_codes').upsert({
    phone: normalized,
    code,
    expires_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
  })
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
