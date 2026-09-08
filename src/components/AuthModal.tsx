'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const reset = () => {
    setStep(1)
    setEmail('')
    setCode('')
    setAgree(false)
    setError('')
  }

  const close = () => {
    reset()
    onClose()
  }

  const sendCode = async () => {
    if (!agree) {
      setError('Нужно согласие на обработку персональных данных')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Введите корректный email')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Не удалось отправить код')
        return
      }

      setStep(2)
    } catch {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('Введите 6-значный код')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Неверный код')
        return
      }

      const supabase = createClient()

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })

      if (signInError) {
        setError(
          'Код верный, но не удалось войти: ' +
            signInError.message
        )
        return
      }

      try {
        await fetch('/api/auth/login-notification', {
          method: 'POST',
        })
      } catch (notificationError) {
        console.error(
          'Не удалось отправить служебное уведомление о входе',
          notificationError
        )
      }

      close()
      window.location.reload()
    } catch {
      setError('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        className="bg-surface rounded-2xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 1 ? (
          <>
            <h2 className="text-xl font-bold mb-4">
              Вход по email
            </h2>

            <input
              type="email"
              placeholder="example@mail.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendCode()
              }}
              className="w-full border rounded-lg px-4 py-2.5 mb-3 outline-none focus:ring-2 focus:ring-primary-300"
            />

            <label className="flex items-start gap-2 text-xs text-gray-500 mb-4">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5"
              />

              <span>
                Даю согласие на обработку персональных данных в
                соответствии с ФЗ от 27.07.2006 № 152-ФЗ
                «О персональных данных». После нажатия
                «Получить код» на указанный email будет
                отправлено письмо с кодом подтверждения.
              </span>
            </label>

            {error && (
              <p className="text-red-400 text-sm mb-3">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              onClick={sendCode}
              className="w-full btn-gradient text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Отправляем...' : 'Получить код'}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">
              Подтверждение
            </h2>

            <p className="text-center text-sm text-gray-500 mb-3">
              Мы отправили код на{' '}
              <span className="font-medium text-gray-700">
                {email}
              </span>
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6)
                )
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') verifyCode()
              }}
              className="w-full border rounded-lg px-4 py-3 mb-4 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="000000"
            />

            {error && (
              <p className="text-red-400 text-sm mb-3 text-center">
                {error}
              </p>
            )}

            <button
              disabled={loading || code.length !== 6}
              onClick={verifyCode}
              className="w-full btn-gradient text-white font-medium py-2.5 rounded-lg disabled:opacity-50 mb-2"
            >
              {loading ? 'Проверяем...' : 'Войти'}
            </button>

            <button
              onClick={() => {
                setStep(1)
                setCode('')
                setError('')
              }}
              className="w-full text-sm text-gray-500 py-2"
            >
              Изменить email
            </button>

            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full text-sm text-primary-600 py-2 disabled:opacity-50"
            >
              Отправить код ещё раз
            </button>
          </>
        )}
      </div>
    </div>
  )
}
