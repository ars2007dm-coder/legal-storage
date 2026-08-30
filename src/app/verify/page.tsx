'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound } from 'lucide-react'

export default function VerifyPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    setLoading(true)

    const res = await fetch('/api/verify-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })
    const data = await res.json()

    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Не удалось подтвердить доступ')
      return
    }

    router.push('/homework')
    router.refresh()
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="bg-surface rounded-2xl border p-8 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-2">
          <KeyRound className="w-7 h-7 text-primary-600" />
          <h1 className="text-xl font-bold text-gray-900">Код доступа</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Введите номер телефона и код, который вам передал администратор.
        </p>

        <div className="space-y-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 999-99-99"
            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-300"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код доступа"
            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-300 text-center tracking-widest"
          />
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <button
          disabled={loading}
          onClick={submit}
          className="w-full btn-gradient text-white font-medium py-2.5 rounded-lg disabled:opacity-50 mt-5"
        >
          {loading ? 'Проверка...' : 'Войти'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          Ещё нет заявки?{' '}
          <Link href="/join" className="text-primary-600 font-medium hover:underline">
            Подать заявку
          </Link>
        </p>
      </div>
    </div>
  )
}
