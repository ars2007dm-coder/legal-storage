import { createAdminClient } from '@/lib/supabase/admin'
import { approveRequest, rejectRequest } from '../actions'

export default async function AdminRequestsPage() {
  const supabase = createAdminClient()
  const { data: requests } = await supabase
    .from('access_requests')
    .select('*')
    .order('created_at', { ascending: false })

  const pending = requests?.filter((r) => r.status === 'pending') ?? []
  const others = requests?.filter((r) => r.status !== 'pending') ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10">
      <h1 className="text-xl font-bold text-gray-900 mb-4">
        Заявки на доступ {pending.length > 0 && `(${pending.length} новых)`}
      </h1>

      <div className="space-y-3 mb-8">
        {pending.map((r) => (
          <div key={r.id} className="bg-surface rounded-xl border p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">{r.name}</p>
              <p className="text-sm text-gray-500">{r.phone}{r.grade ? ` · ${r.grade} класс` : ''}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <form action={approveRequest.bind(null, r.id)}>
                <button className="bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-green-700">
                  Одобрить
                </button>
              </form>
              <form action={rejectRequest.bind(null, r.id)}>
                <button className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-200">
                  Отклонить
                </button>
              </form>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-gray-400 text-sm">Новых заявок нет</p>}
      </div>

      <h2 className="text-sm font-medium text-gray-500 mb-3">Обработанные</h2>
      <div className="space-y-2">
        {others.map((r) => (
          <div key={r.id} className="bg-surface rounded-xl border p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">{r.name}</p>
              <p className="text-sm text-gray-500">{r.phone}{r.grade ? ` · ${r.grade} класс` : ''}</p>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  r.status === 'approved' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                }`}
              >
                {r.status === 'approved' ? 'Одобрено' : 'Отклонено'}
              </span>
              {r.status === 'approved' && r.access_code && (
                <p className="text-sm font-mono text-gray-700 mt-1">Код: {r.access_code}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
