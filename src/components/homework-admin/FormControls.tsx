'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Trash2 } from 'lucide-react'

export function SubmitButton({ children, pendingLabel, className }: {
  children: React.ReactNode
  pendingLabel: string
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <>
      <button type="submit" disabled={pending} aria-disabled={pending} className={className}>
        {pending && <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin motion-reduce:animate-none" />}
        <span>{pending ? pendingLabel : children}</span>
      </button>
      <span className="sr-only" role="status">{pending ? pendingLabel : ''}</span>
    </>
  )
}

export function DeleteControls({ title }: { title: string }) {
  const { pending } = useFormStatus()
  const [confirming, setConfirming] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)

  return (
    <div className="text-sm">
      <button ref={trigger} type="button" disabled={pending} aria-expanded={confirming}
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-primary-700 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-300 disabled:opacity-50">
        <Trash2 aria-hidden="true" className="w-4 h-4" /> Удалить
      </button>
      {confirming && (
        <div className="mt-2 rounded-xl border border-primary-200 bg-primary-50 p-3">
          <p className="text-gray-700 break-words">Удалить задание «{title}»? Это действие нельзя отменить.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SubmitButton pendingLabel="Удаляем…" className="btn-gradient inline-flex items-center gap-2 rounded-lg px-3 py-2 text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-300">Удалить задание</SubmitButton>
            <button type="button" disabled={pending} onClick={() => { setConfirming(false); trigger.current?.focus() }}
              className="rounded-lg border px-3 py-2 text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-300 disabled:opacity-50">Отмена</button>
          </div>
        </div>
      )}
    </div>
  )
}
