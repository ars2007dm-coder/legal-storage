import { Megaphone, CalendarDays, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ExpandableText from '@/components/ExpandableText'
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  createDeadline,
  deleteDeadline,
} from '../actions'

export default async function AdminAnnouncementsPage() {
  const supabase = createClient()

  const [{ data: announcements }, { data: deadlines }] = await Promise.all([
    supabase.from('announcements').select('*').order('created_at', { ascending: false }),
    supabase.from('deadlines').select('*').order('deadline_date', { ascending: true }),
  ])

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16 space-y-10">
      {/* ОБЪЯВЛЕНИЯ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Объявления</h1>
        </div>

        <div className="bg-surface rounded-2xl border p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Новое объявление</h2>
          <form action={createAnnouncement} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Заголовок</label>
              <input name="title" required className="w-full border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Текст</label>
              <textarea name="content" required rows={4} className="w-full border rounded-lg px-3 py-2 bg-background" />
            </div>
            <button type="submit" className="btn-gradient text-white px-5 py-2 rounded-lg font-medium">
              Опубликовать
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {announcements?.map((a) => (
            <div key={a.id} className="bg-surface rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900">{a.title}</p>
                  <ExpandableText text={a.content} />
                </div>
                <form action={deleteAnnouncement.bind(null, a.id)}>
                  <button type="submit" className="text-gray-400 hover:text-red-600 shrink-0" aria-label="Удалить">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <details className="mt-3">
                <summary className="text-sm text-primary-600 cursor-pointer select-none">Редактировать</summary>
                <form action={updateAnnouncement.bind(null, a.id)} className="space-y-3 mt-3">
                  <input
                    name="title"
                    defaultValue={a.title}
                    required
                    className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
                  />
                  <textarea
                    name="content"
                    defaultValue={a.content}
                    required
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
                  />
                  <button type="submit" className="btn-gradient text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                    Сохранить
                  </button>
                </form>
              </details>
            </div>
          ))}
          {announcements?.length === 0 && (
            <p className="text-gray-400 text-center py-6">Пока нет объявлений</p>
          )}
        </div>
      </section>

      {/* ДЕДЛАЙНЫ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Дедлайны</h1>
        </div>

        <div className="bg-surface rounded-2xl border p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Новый дедлайн</h2>
          <form action={createDeadline} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Название</label>
              <input name="title" required className="w-full border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Дата</label>
              <input
                type="date"
                name="deadline_date"
                required
                className="w-full border rounded-lg px-3 py-2 bg-background"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Комментарий (необязательно)</label>
              <input name="description" className="w-full border rounded-lg px-3 py-2 bg-background" />
            </div>
            <button type="submit" className="btn-gradient text-white px-5 py-2 rounded-lg font-medium">
              Добавить дедлайн
            </button>
          </form>
        </div>

        <div className="space-y-2">
          {deadlines?.map((d) => (
            <div key={d.id} className="flex items-center justify-between bg-surface rounded-xl border p-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{d.title}</p>
                <p className="text-sm text-gray-500">
                  {new Date(d.deadline_date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {d.description ? ` — ${d.description}` : ''}
                </p>
              </div>
              <form action={deleteDeadline.bind(null, d.id)}>
                <button type="submit" className="text-gray-400 hover:text-red-600 shrink-0" aria-label="Удалить">
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          ))}
          {deadlines?.length === 0 && (
            <p className="text-gray-400 text-center py-6">Пока нет дедлайнов</p>
          )}
        </div>
      </section>
    </div>
  )
}
