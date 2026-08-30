import Link from 'next/link'
import { FileText, BookOpen, ClipboardList, Search, Megaphone, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ExpandableText from '@/components/ExpandableText'

// Главная страница «ФСМО lite»
// Структура по брифу (раздел 6.2):
// 1. Hero-секция с заголовком и подзаголовком
// 2. Глобальный поиск (форма отправляет на /search?q=...)
// 3. Объявления + ближайшие дедлайны (если есть хоть что-то одно)
// 4. 3 большие кнопки-карточки: НПА / Литература / Задачи
// 5. Статистика (реальные цифры из Supabase, не заглушка)

export const revalidate = 60 // обновлять статистику раз в минуту

export default async function HomePage() {
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [
    { count: refsCount },
    { count: tasksCount },
    { count: booksCount },
    { data: announcements },
    { data: deadlines },
  ] = await Promise.all([
    supabase.from('refs').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
    supabase
      .from('deadlines')
      .select('*')
      .gte('deadline_date', today)
      .order('deadline_date', { ascending: true })
      .limit(5),
  ])

  const hasBoard = (announcements && announcements.length > 0) || (deadlines && deadlines.length > 0)

  return (
    <div className="bg-gradient-to-b from-background to-surface min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
        {/* Hero */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          ФСМО <span className="font-accent text-gold-light">lite</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          Умное хранилище материалов для подготовки к олимпиадам по праву.
          Быстро находите нормативные акты, учебники и задачи — всё в одном месте.
        </p>

        {/* Глобальный поиск */}
        <form action="/search" method="GET" className="max-w-xl mx-auto mb-12">
          <label className="flex items-center gap-3 bg-surface border rounded-xl shadow-sm hover:shadow-md focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary-300 transition-all px-4 py-3 cursor-text">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              name="q"
              type="text"
              placeholder="Поиск по НПА, книгам и задачам..."
              className="w-full outline-none text-gray-700 bg-transparent"
            />
          </label>
        </form>

        {/* Объявления + дедлайны */}
        {hasBoard && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-14 text-left">
            {/* Объявления */}
            <div className="bg-surface rounded-2xl border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-gray-900">Объявления</h2>
              </div>
              {announcements && announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id}>
                      <p className="font-medium text-gray-900 text-sm">{a.title}</p>
                      <ExpandableText text={a.content} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Пока нет объявлений</p>
              )}
            </div>

            {/* Дедлайны */}
            <div className="bg-surface rounded-2xl border p-5">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-gray-900">Ближайшие дедлайны</h2>
              </div>
              {deadlines && deadlines.length > 0 ? (
                <div className="space-y-2">
                  {deadlines.map((d) => (
                    <div key={d.id} className="flex items-center gap-3">
                      <div className="shrink-0 w-11 text-center bg-primary-50 rounded-lg py-1">
                        <div className="text-xs font-bold text-primary-600">
                          {new Date(d.deadline_date).toLocaleDateString('ru-RU', { day: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-primary-600 uppercase">
                          {new Date(d.deadline_date).toLocaleDateString('ru-RU', { month: 'short' })}
                        </div>
                      </div>
                      <p className="text-sm text-gray-900 min-w-0 truncate">{d.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Дедлайнов пока нет</p>
              )}
            </div>
          </div>
        )}

        {/* 3 большие кнопки */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-14">
          <Link
            href="/npa"
            className="group flex flex-col items-center p-8 bg-surface rounded-2xl border hover:shadow-lg hover:border-primary-300 hover:-translate-y-1 transition-all"
          >
            <div className="w-16 h-16 flex items-center justify-center bg-primary-50 rounded-2xl mb-4">
              <FileText className="w-7 h-7 text-primary-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">НПА</span>
            <span className="text-sm text-gray-500">Нормативные акты</span>
          </Link>

          <Link
            href="/books"
            className="group flex flex-col items-center p-8 bg-surface rounded-2xl border hover:shadow-lg hover:border-primary-300 hover:-translate-y-1 transition-all"
          >
            <div className="w-16 h-16 flex items-center justify-center bg-primary-50 rounded-2xl mb-4">
              <BookOpen className="w-7 h-7 text-primary-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">Литература</span>
            <span className="text-sm text-gray-500">Учебники и книги</span>
          </Link>

          <Link
            href="/tasks"
            className="group flex flex-col items-center p-8 bg-surface rounded-2xl border hover:shadow-lg hover:border-primary-300 hover:-translate-y-1 transition-all"
          >
            <div className="w-16 h-16 flex items-center justify-center bg-primary-50 rounded-2xl mb-4">
              <ClipboardList className="w-7 h-7 text-primary-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">Задачи</span>
            <span className="text-sm text-gray-500">Олимпиадные задания</span>
          </Link>
        </div>

        {/* Статистика — реальные цифры из базы */}
        <div className="grid grid-cols-3 max-w-md mx-auto gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-gold-light">{refsCount ?? 0}+</div>
            <div className="text-sm text-gray-500">НПА</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gold-light">{tasksCount ?? 0}+</div>
            <div className="text-sm text-gray-500">задач</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gold-light">{booksCount ?? 0}+</div>
            <div className="text-sm text-gray-500">книг</div>
          </div>
        </div>
      </div>
    </div>
  )
}
