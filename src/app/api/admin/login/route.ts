import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD не настроен на сервере' },
      { status: 500 }
    )
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, 'granted', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 дней
  })
  return res
}
