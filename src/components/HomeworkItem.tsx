'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'

interface Homework {
  id: string
  title: string
  instructions: string
  category: string | null
}

export default function HomeworkItem({ homework }: { homework: Homework }) {
  const [open, setOpen] = useState(false)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [score, setScore] = useState<string | null>(null)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!answer.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/check-homework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeworkId: homework.id, answerText: answer }),
    })
    const data = await res.json()

    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Не удалось проверить ответ')
      return
    }
    setFeedback(data.feedback)
    setScore(data.score)
  }

  return (
    <div className="bg-surface rounded-xl border p-5">
      <button onClick={() => setOpen(!open)} className="w-full text-left">
        <h3 className="font-semibold text-lg text-gray-900">{homework.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{homework.instructions}</p>
      </button>

      {open && !feedback && (
        <div className="mt-4 pt-4 border-t">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Напишите ваш ответ..."
            rows={5}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          <button
            disabled={loading}
            onClick={submit}
            className="mt-3 flex items-center gap-2 btn-gradient text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Проверяю...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Отправить на проверку
              </>
            )}
          </button>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 text-sm font-medium text-primary-600 hover:underline"
        >
          Ответить →
        </button>
      )}

      {feedback && (
        <div className="mt-4 pt-4 border-t bg-primary-50 -mx-5 -mb-5 px-5 pb-5 rounded-b-xl">
          {score && (
            <p className="font-bold text-primary-700 mb-2">Оценка: {score}</p>
          )}
          <p className="text-sm text-gray-700 whitespace-pre-line">{feedback}</p>
        </div>
      )}
    </div>
  )
}
