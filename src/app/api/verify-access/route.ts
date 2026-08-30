import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json()

  if (!phone || !code) {
    return NextResponse.json({ error: 'Укажите телефон и код' }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase.rpc('verify_access_code', {
    p_phone: phone,
    p_code: code,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Неверный телефон или код' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('fsmo_student_phone', phone, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180, // 180 дней
  })
  return res
}
