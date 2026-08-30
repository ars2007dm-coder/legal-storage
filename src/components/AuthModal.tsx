'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Вход по телефону через собственную систему кодов (SMS.ru), а не
// через встроенный Twilio-провайдер Supabase — Twilio не доставляет
// SMS на российские номера. После проверки кода создаётся настоящая
// сессия Supabase Auth через одноразовый пароль.

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const reset = () => {
    setStep(1)
    setPhone('')
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
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json()

    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Не удалось отправить код')
      return
    }
    setStep(2)
  }

  const verifyCode = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })
    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(data.error || 'Неверный код')
      return
    }

    // Создаём настоящую сессию Supabase Auth одноразовым паролем
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      phone: data.phone,
      password: data.password,
    })

    setLoading(false)
    if (signInError) {
      setError('Код верный, но не удалось войти: ' + signInError.message)
      return
    }

    close()
    window.location.reload()
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
            <h2 className="text-xl font-bold mb-4">Вход по телефону</h2>
            <input
              type="tel"
              placeholder="+7 (999) 999-99-99"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 mb-3 outline-none focus:ring-2 focus:ring-primary-300"
            />
            <label className="flex items-start gap-2 text-xs text-gray-500 mb-4">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5"
              />
              Даю согласие на обработку персональных данных в соответствии с ФЗ от
              27.07.2006 № 152-ФЗ «О персональных данных». После нажатия «Получить
              код» вам поступит короткий звонок — код это последние 4 цифры
              номера, с которого позвонили.
            </label>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              disabled={loading}
              onClick={sendCode}
              className="w-full btn-gradient text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Звоним...' : 'Получить код'}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Подтверждение</h2>
            <p className="text-center text-sm text-gray-500 mb-3">Вам звонят на {phone} — введите последние 4 цифры номера звонящего</p>
            <input
              type="text"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border rounded-lg px-4 py-3 mb-4 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="0000"
            />
            {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}
            <button
              disabled={loading}
              onClick={verifyCode}
              className="w-full btn-gradient text-white font-medium py-2.5 rounded-lg disabled:opacity-50 mb-2"
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button onClick={() => setStep(1)} className="w-full text-sm text-gray-500 py-2">
              Изменить номер
            </button>
          </>
        )}
      </div>
    </div>
  )
}
