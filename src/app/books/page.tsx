import { BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BookFilters from '@/components/BookFilters'
import FavoriteButton from '@/components/FavoriteButton'
import { categoryLabels, bookTypeLabels } from '@/lib/labels'
import type { Book } from '@/types/database'

export default async function BooksPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const supabase = createClient()
  let query = supabase.from('books').select('*').order('title')

  if (searchParams.q) {
    query = query.or(`title.ilike.%${searchParams.q}%,author.ilike.%${searchParams.q}%`)
  }
  if (searchParams.category) query = query.eq('category', searchParams.category)
  if (searchParams.type) query = query.eq('type', searchParams.type)

  const { data: books, error } = await query

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Литература</h1>
        </div>
        <p className="text-gray-500 mb-6">Учебники, комментарии и монографии для подготовки</p>

        <BookFilters />

        {error && <p className="text-red-600 mb-4">Ошибка загрузки: {error.message}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books?.map((book: Book) => (
            <div key={book.id} className="bg-surface rounded-xl border p-5 flex flex-col">
              <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.cover_url} alt={book.title} className="h-full object-contain" />
                ) : (
                  <BookOpen className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">
                    {bookTypeLabels[book.type]?.label ?? book.type}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {categoryLabels[(book as any).category]?.label ?? ''}
                  </span>
                </div>
                <FavoriteButton itemType="book" itemId={book.id} className="-mt-1 -mr-1" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900">{book.title}</h3>
              <p className="text-sm text-gray-500 mb-3">
                {book.author}
                {book.year ? ` · ${book.year}` : ''}
              </p>
              {book.pdf_url && (
                <a
                  href={book.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-600 hover:underline mt-auto"
                >
                  Открыть PDF
                </a>
              )}
            </div>
          ))}
          {books?.length === 0 && (
            <p className="text-gray-400 text-center py-10 col-span-full">Ничего не найдено</p>
          )}
        </div>
      </div>
    </div>
  )
}
