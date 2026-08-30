'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'

export default function AdminLoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Ошибка входа')
      return
    }
    window.location.reload()
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="bg-surface rounded-2xl border p-8 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-6 h-6 text-primary-600" />
          <h1 className="text-xl font-bold text-gray-900">Вход в админку</h1>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Пароль администратора"
          className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-300"
          autoFocus
        />
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <button
          disabled={loading}
          onClick={submit}
          className="w-full btn-gradient text-white font-medium py-2.5 rounded-lg disabled:opacity-50 mt-4"
        >
          {loading ? 'Проверка...' : 'Войти'}
        </button>
      </div>
    </div>
  )
}
