'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, CheckCircle2, Loader2, Send } from 'lucide-react'
import styles from './Homework.module.css'

interface Homework {
  id: string
  title: string
  instructions: string
  category: string | null
}

export default function HomeworkItem({ homework }: { homework: Homework }) {
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [score, setScore] = useState<string | null>(null)
  const [error, setError] = useState('')
  const id = useId()
  const textarea = useRef<HTMLTextAreaElement>(null)
  const submitting = useRef(false)
  const focusAnswer = useRef(false)

  useEffect(() => {
    if (started && open && focusAnswer.current) {
      textarea.current?.focus()
      focusAnswer.current = false
    }
  }, [started, open])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!answer.trim() || submitting.current || feedback !== null) return
    submitting.current = true
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/check-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeworkId: homework.id, answerText: answer }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Не удалось проверить ответ. Попробуйте ещё раз.')
        return
      }
      if (typeof data?.feedback !== 'string' || !data.feedback.trim()) {
        setError('Не удалось получить результат проверки. Ваш ответ остался в поле — попробуйте ещё раз.')
        return
      }
      setFeedback(data.feedback)
      setScore(typeof data.score === 'string' || typeof data.score === 'number' ? String(data.score) : null)
    } catch {
      setError('Не удалось связаться с проверкой. Ваш ответ остался в поле. Проверьте соединение и попробуйте ещё раз.')
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <article className={styles.item}>
      <button type="button" className={styles.folder} aria-expanded={open} aria-controls={`${id}-content`} onClick={() => setOpen(!open)}>
        <span className={styles.folderObject}>
          <span className={styles.back} aria-hidden="true" />
          <span className={styles.paper} aria-hidden="true" />
          <span className={`${styles.paper} ${styles.secondPaper}`} aria-hidden="true" />
          <span className={styles.front}>
            <span className={styles.folderEyebrow}>Домашнее задание</span>
            <span className={styles.folderTitle}>{homework.title}</span>
            <span className={styles.folderCategory}>{homework.category || 'Практика и знания'}</span>
          </span>
        </span>
        <span className={styles.folderCaption}>
          <span>{open ? 'Закрыть папку' : 'Открыть папку'}</span>
          {open ? <ArrowDown size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}
        </span>
      </button>

      <div className={styles.workspace}>
        <div className={styles.reveal} data-open={!open} aria-hidden={open} ref={(node) => { if (node) node.inert = open }}>
          <div className={styles.revealInner}>
          <div className={styles.closed}>
            <span className={styles.eyebrow}>{feedback !== null ? 'Проверка завершена' : started ? 'Работа начата' : 'Ваш следующий шаг'}</span>
            <h2 className={styles.previewTitle}>{homework.title}</h2>
            <p>{feedback !== null ? 'Откройте папку, чтобы посмотреть оценку и обратную связь.' : started ? 'Откройте папку, чтобы вернуться к своему ответу.' : 'Откройте папку, прочитайте условие и приступайте к заданию в удобном темпе.'}</p>
            <span className={styles.stepHint}>Условие <span aria-hidden="true">→</span> Ваш ответ <span aria-hidden="true">→</span> Обратная связь</span>
          </div>
          </div>
        </div>
        <div id={`${id}-content`} className={styles.reveal} data-open={open} aria-hidden={!open} ref={(node) => { if (node) node.inert = !open }}>
          <div className={styles.revealInner}>
          <div className={styles.detail}>
          <span className={styles.eyebrow}>Условие задания</span>
          <h2 className={styles.previewTitle}>{homework.title}</h2>
          <p className={styles.instructions}>{homework.instructions}</p>

          {!started && feedback === null && (
            <div className={styles.startBlock}>
              <p className={styles.helper}>Напишите ответ — ИИ проверит его и даст развёрнутую обратную связь.</p>
              <button type="button" className={styles.action} onClick={() => { focusAnswer.current = true; setStarted(true) }}>
                Начать ДЗ <ArrowUpRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
          {started && feedback === null && (
            <form onSubmit={submit} className={styles.editor} aria-busy={loading}>
              <label htmlFor={`${id}-answer`} className={styles.label}>Ваш ответ</label>
              <textarea ref={textarea} id={`${id}-answer`} value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={loading} placeholder="Запишите решение и объясните ход мысли…" rows={6} className={styles.textarea} aria-describedby={error ? `${id}-error` : undefined} />
              {error && <p id={`${id}-error`} role="alert" className={styles.error}>{error}</p>}
              <div className={styles.editorFooter}>
                <p className={styles.helper}>Перед отправкой проверьте свой ответ.</p>
                <button type="submit" disabled={loading || !answer.trim()} className={styles.action}>
                  {loading ? <><Loader2 size={18} className={styles.spinner} aria-hidden="true" /> Проверяю…</> : <><Send size={17} aria-hidden="true" /> Отправить на проверку</>}
                </button>
              </div>
              <span className="sr-only" role="status">{loading ? 'Ответ отправлен. Идёт проверка.' : ''}</span>
            </form>
          )}
          <div aria-live="polite" aria-atomic="true">
            {feedback !== null && (
              <section className={styles.result} aria-label="Результат проверки">
                <div className={styles.resultHeading}><CheckCircle2 size={21} aria-hidden="true" /><h3>Обратная связь</h3></div>
                {score !== null && <p className={styles.score}>Оценка: {score}</p>}
                <p className={styles.instructions}>{feedback}</p>
              </section>
            )}
          </div>
          </div>
          </div>
        </div>
      </div>
    </article>
  )
}
