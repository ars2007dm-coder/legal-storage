'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { categoryLabels, docTypeLabels, statusLabels } from '@/lib/labels'

export default function NpaFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const submitSearch = () => {
    const input = document.getElementById('npa-search-input') as HTMLInputElement
    update('q', input.value)
  }

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="bg-surface rounded-xl border p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="npa-search-input"
          defaultValue={searchParams.get('q') ?? ''}
          onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
          placeholder="Поиск по названию или аббревиатуре..."
          className="flex-1 border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary-300"
        />
        <button
          onClick={submitSearch}
          className="btn-gradient text-white px-5 py-2 rounded-lg font-medium shrink-0"
        >
          Найти
        </button>
        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="flex items-center justify-center gap-1 text-gray-500 px-3 py-2 hover:text-gray-700 shrink-0"
          >
            <X className="w-4 h-4" /> Сбросить
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <select
          defaultValue={searchParams.get('category') ?? ''}
          onChange={(e) => update('category', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Все категории</option>
          {Object.entries(categoryLabels).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          defaultValue={searchParams.get('doc_type') ?? ''}
          onChange={(e) => update('doc_type', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Все типы</option>
          {Object.entries(docTypeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          defaultValue={searchParams.get('status') ?? ''}
          onChange={(e) => update('status', e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Все статусы</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
