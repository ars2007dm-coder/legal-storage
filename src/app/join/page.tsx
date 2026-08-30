'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function JoinPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [grade, setGrade] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!name.trim() || phone.replace(/\D/g, '').length < 11) {
      setError('Заполните имя и корректный номер телефона')
      return
    }
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('access_requests')
      .insert({ name: name.trim(), phone: phone.trim(), grade: grade.trim() || null })

    if (insertError) {
      setLoading(false)
      setError('Не удалось отправить заявку: ' + insertError.message)
      return
    }

    // Уведомление админу — не критично, если не сработает
    fetch('/api/notify-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, grade }),
    }).catch(() => {})

    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="bg-surface rounded-2xl border p-8 max-w-md text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Заявка отправлена</h1>
          <p className="text-gray-500 mb-6">
            Администратор рассмотрит заявку и свяжется с вами по указанному номеру,
            чтобы передать код доступа.
          </p>
          <Link href="/verify" className="text-primary-600 font-medium hover:underline">
            У меня уже есть код →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="bg-surface rounded-2xl border p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="w-7 h-7 text-primary-600" />
          <h1 className="text-xl font-bold text-gray-900">Заявка на доступ к ДЗ</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Доступ к домашним заданиям выдаётся после одобрения администратором.
        </p>

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя и фамилия"
            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-300"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 999-99-99"
            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-300"
          />
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Класс (необязательно)"
            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <button
          disabled={loading}
          onClick={submit}
          className="w-full btn-gradient text-white font-medium py-2.5 rounded-lg disabled:opacity-50 mt-5"
        >
          {loading ? 'Отправка...' : 'Отправить заявку'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          Уже одобрено?{' '}
          <Link href="/verify" className="text-primary-600 font-medium hover:underline">
            Ввести код доступа
          </Link>
        </p>
      </div>
    </div>
  )
}
