import Link from 'next/link'
import { Search, FileText, BookOpen, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const typeIcons: Record<string, any> = {
  ref: FileText,
  book: BookOpen,
  task: ClipboardList,
}

const typeLinks: Record<string, string> = {
  ref: '/npa',
  book: '/books',
  task: '/task',
}

const typeLabels: Record<string, string> = {
  ref: 'НПА',
  book: 'Литература',
  task: 'Задача',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const q = searchParams.q ?? ''
  const supabase = createClient()

  let results: any[] = []
  let error: string | null = null

  if (q.trim().length > 0) {
    // Используем функцию global_search(query_text) из SQL-скрипта
    const { data, error: rpcError } = await supabase.rpc('global_search', { query_text: q })
    if (rpcError) error = rpcError.message
    else results = data ?? []
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Поиск</h1>

        <form action="/search" method="GET" className="mb-6">
          <label className="flex items-center gap-3 bg-surface rounded-xl border px-4 py-3 focus-within:ring-2 focus-within:ring-primary-300">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Поиск по НПА, книгам и задачам..."
              className="w-full text-lg outline-none"
              autoFocus
            />
          </label>
        </form>

        {error && <p className="text-red-600 mb-4">Ошибка поиска: {error}</p>}

        {q.trim().length > 0 && (
          <div className="space-y-2">
            {results.map((r) => {
              const Icon = typeIcons[r.item_type] ?? FileText
              const href = r.item_type === 'task' ? `/task/${r.id}` : typeLinks[r.item_type]
              return (
                <Link
                  key={`${r.item_type}-${r.id}`}
                  href={href}
                  className="flex items-center gap-4 bg-surface rounded-xl border p-4 hover:shadow-md transition-shadow"
                >
                  <Icon className="w-5 h-5 text-primary-600 shrink-0" />
                  <div>
                    <p className="text-xs uppercase text-gray-400 mb-0.5">{typeLabels[r.item_type]}</p>
                    <p className="font-semibold text-gray-900">{r.title}</p>
                    {r.subtitle && <p className="text-sm text-gray-500">{r.subtitle}</p>}
                  </div>
                </Link>
              )
            })}
            {results.length === 0 && (
              <p className="text-gray-400 text-center py-10">Ничего не найдено по запросу «{q}»</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
