import { createAdminClient } from '@/lib/supabase/admin'
import { deleteBook } from '../actions'

export default async function AdminBooksPage() {
  const supabase = createAdminClient()
  const { data: books } = await supabase.from('books').select('*').order('title')

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Управление книгами</h1>
      <p className="text-sm text-gray-500 mb-6">
        Чтобы добавить новую книгу — перейдите во вкладку «Добавить материалы».
        Здесь можно только просмотреть список и удалить лишнее (например, тестовые записи).
      </p>

      <div className="space-y-2">
        {books?.map((b: any) => (
          <div key={b.id} className="bg-surface rounded-xl border p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{b.title}</p>
              <p className="text-sm text-gray-500 truncate">
                {b.author}{b.year ? ` · ${b.year}` : ''} · тип: {b.type || '—'}
                {b.pdf_url ? '' : ' · без ссылки на PDF'}
              </p>
            </div>
            <form action={deleteBook.bind(null, b.id)}>
              <button className="text-sm text-red-400 hover:underline shrink-0">Удалить</button>
            </form>
          </div>
        ))}
        {books?.length === 0 && <p className="text-gray-400 text-sm">Книг пока нет</p>}
      </div>
    </div>
  )
}
