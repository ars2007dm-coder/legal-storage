import { NextRequest, NextResponse } from 'next/server'

// Отправляет письмо администратору о новой заявке на доступ через Resend.
// Если RESEND_API_KEY или ADMIN_EMAIL не настроены — просто ничего не
// отправляет (не ломает заявку, админ всё равно увидит её в /admin/requests).

export async function POST(req: NextRequest) {
  const { name, phone, grade } = await req.json()

  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) {
    return NextResponse.json({ skipped: true })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ФСМО lite <onboarding@resend.dev>',
        to: [process.env.ADMIN_EMAIL],
        subject: 'Новая заявка на доступ — ФСМО lite',
        text: `Новая заявка на доступ.\n\nИмя: ${name}\nТелефон: ${phone}\nКласс: ${grade || 'не указан'}\n\nОдобрить: зайдите в /admin/requests`,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
