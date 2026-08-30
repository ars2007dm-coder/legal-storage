'use client'

import { useEffect, useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Простой просмотр таблиц refs/tasks/books + экспорт в CSV
// (CSV открывается в Excel без проблем)

type TableName = 'refs' | 'tasks' | 'books'

export default function AdminOverviewPage() {
  const supabase = createClient()
  const [table, setTable] = useState<TableName>('refs')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from(table).select('*').limit(200)
      setRows(data ?? [])
      setLoading(false)
    }
    load()
  }, [table])

  const exportCsv = () => {
    if (rows.length === 0) return
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${table}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-10">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['refs', 'tasks', 'books'] as TableName[]).map((t) => (
          <button
            key={t}
            onClick={() => setTable(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              table === t ? 'btn-gradient text-white' : 'bg-surface border text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
        <button
          onClick={exportCsv}
          className="ml-auto flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <FileSpreadsheet className="w-4 h-4" /> Скачать в Excel (CSV)
        </button>
      </div>

      <div className="bg-surface rounded-xl border overflow-x-auto">
        {loading ? (
          <p className="p-6 text-gray-400">Загрузка...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {rows[0] &&
                  Object.keys(rows[0]).map((k) => (
                    <th key={k} className="text-left px-4 py-2 font-medium text-gray-600 whitespace-nowrap">
                      {k}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  {Object.values(r).map((v: any, j) => (
                    <td key={j} className="px-4 py-2 text-gray-700 whitespace-nowrap max-w-xs truncate">
                      {String(v ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && rows.length === 0 && <p className="p-6 text-gray-400">Нет данных</p>}
      </div>
    </div>
  )
}
