import { createAdminClient } from '@/lib/supabase/admin'
import { createVideo, deleteVideo } from '../actions'

const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300'
const labelClass = 'text-xs font-medium text-gray-500 mb-1 block'

export default async function AdminVideosPage() {
  const supabase = createAdminClient()
  const { data: videos } = await supabase
    .from('videos')
    .select('*, tasks(title)')
    .order('id', { ascending: false })

  const { data: tasks } = await supabase.from('tasks').select('id, title').order('title')

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10 space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Видеоразборы</h1>

      <section className="bg-surface rounded-xl border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Новое видео</h2>
        <form action={createVideo} className="space-y-3">
          <div>
            <label className={labelClass}>Название</label>
            <input name="title" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ссылка на видео</label>
            <input name="video_url" required placeholder="https://..." className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Автор / преподаватель</label>
              <input name="teacher_name" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Длительность (мин)</label>
              <input name="duration" type="number" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Привязать к задаче (необязательно)</label>
            <select name="task_id" className={inputClass} defaultValue="">
              <option value="">— без привязки —</option>
              {tasks?.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <button className="btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg">
            Добавить видео
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Все видео</h2>
        <div className="space-y-2">
          {videos?.map((v: any) => (
            <div key={v.id} className="bg-surface rounded-xl border p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{v.title}</p>
                <p className="text-sm text-gray-500 truncate">
                  {v.teacher_name || '—'}
                  {v.tasks?.title ? ` · задача: ${v.tasks.title}` : ''}
                </p>
              </div>
              <form action={deleteVideo.bind(null, v.id)}>
                <button className="text-sm text-red-600 hover:underline shrink-0">Удалить</button>
              </form>
            </div>
          ))}
          {videos?.length === 0 && <p className="text-gray-400 text-sm">Видео пока нет</p>}
        </div>
      </section>
    </div>
  )
}
