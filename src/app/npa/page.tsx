import { FileText, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import NpaFilters from '@/components/NpaFilters'
import FavoriteButton from '@/components/FavoriteButton'
import { categoryLabels, docTypeLabels, statusLabels } from '@/lib/labels'
import type { Ref } from '@/types/database'

export default async function NpaPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const supabase = createClient()
  let query = supabase.from('refs').select('*').order('title')

  if (searchParams.q) {
    query = query.or(`title.ilike.%${searchParams.q}%,abbr.ilike.%${searchParams.q}%`)
  }
  if (searchParams.category) query = query.eq('category', searchParams.category)
  if (searchParams.doc_type) query = query.eq('doc_type', searchParams.doc_type)
  if (searchParams.status) query = query.eq('status', searchParams.status)

  const { data: refs, error } = await query

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Нормативные правовые акты</h1>
        </div>
        <p className="text-gray-500 mb-6">
          Кодексы, законы, указы и постановления для подготовки к олимпиаде
        </p>

        <NpaFilters />

        {error && <p className="text-red-600 mb-4">Ошибка загрузки: {error.message}</p>}

        <div className="space-y-3">
          {refs?.map((ref: Ref) => (
            <div key={ref.id} className="bg-surface rounded-xl border p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">
                    {docTypeLabels[ref.doc_type]?.label ?? ref.doc_type}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {categoryLabels[ref.category]?.label ?? ref.category}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      statusLabels[ref.status]?.color ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {statusLabels[ref.status]?.label ?? ref.status}
                  </span>
                </div>
                <FavoriteButton itemType="ref" itemId={ref.id} className="-mt-1 -mr-1" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900">{ref.title}</h3>
              {ref.abbr && (
                <p className="text-sm text-gray-500 mb-3">
                  {ref.abbr}
                  {ref.year ? ` · ${ref.year}` : ''}
                </p>
              )}
              <a
                href={ref.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-100"
              >
                Открыть <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
          {refs?.length === 0 && (
            <p className="text-gray-400 text-center py-10">Ничего не найдено</p>
          )}
        </div>
      </div>
    </div>
  )
}
