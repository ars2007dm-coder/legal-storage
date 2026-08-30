import { createAdminClient } from '@/lib/supabase/admin'
import { createHomework, deleteHomework, updateHomeworkAssignment } from '../actions'
import { normalizePhone } from '@/lib/normalizePhone'
import ExpandableText from '@/components/ExpandableText'

const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300'
const labelClass = 'text-xs font-medium text-gray-500 mb-1 block'

export default async function AdminHomeworkPage() {
  const supabase = createAdminClient()

  const [{ data: homework }, { data: submissions }, usersRes, { data: profiles }] = await Promise.all([
    supabase.from('homework').select('*').order('created_at', { ascending: false }),
    supabase.from('homework_submissions').select('*').order('created_at', { ascending: false }).limit(30),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from('profiles').select('id, full_name, student_class'),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  // Список учеников для выпадающего списка: только те, у кого заполнен
  // личный кабинет (иначе нет имени, чтобы показать админу) и есть
  // подтверждённый номер телефона (обычный вход через SMS.ru).
  const students = (usersRes.data?.users ?? [])
    .filter((u) => u.phone && profileMap.get(u.id)?.full_name)
    .map((u) => {
      const profile = profileMap.get(u.id)!
      return {
        phone: normalizePhone(u.phone),
        label: `${profile.full_name}${profile.student_class ? ` (${profile.student_class} класс)` : ''}`,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'))

  const studentLabel = (phone: string | null) => {
    if (!phone) return null
    const match = students.find((s) => s.phone === normalizePhone(phone))
    return match?.label ?? phone
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10 space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Домашние задания</h1>

      <section className="bg-surface rounded-xl border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Новое задание</h2>
        <form action={createHomework} className="space-y-3">
          <div>
            <label className={labelClass}>Название</label>
            <input name="title" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Условие / инструкция (видит ученик)</label>
            <textarea name="instructions" required rows={3} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Эталонный ответ / критерии для ИИ (ученик НЕ видит, используется только для проверки)
            </label>
            <textarea name="model_answer" required rows={4} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Категория (необязательно)</label>
            <input name="category" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Кому назначить</label>
            <select name="assigned_phone" className={inputClass} defaultValue="">
              <option value="">Всем ученикам</option>
              {students.map((s) => (
                <option key={s.phone} value={s.phone}>
                  {s.label}
                </option>
              ))}
            </select>
            {students.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Пока никто не заполнил личный кабинет (ФИО) — список появится, когда ученики это сделают.
              </p>
            )}
          </div>
          <button className="btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg">
            Добавить задание
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Список заданий</h2>
        <div className="space-y-2">
          {homework?.map((hw) => (
            <div key={hw.id} className="bg-surface rounded-xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{hw.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">{hw.instructions}</p>
                  <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                    {hw.assigned_phone ? studentLabel(hw.assigned_phone) : 'Всем ученикам'}
                  </span>
                </div>
                <form action={deleteHomework.bind(null, hw.id)}>
                  <button className="text-sm text-red-600 hover:underline shrink-0">Удалить</button>
                </form>
              </div>

              <details className="mt-3">
                <summary className="text-sm text-primary-600 cursor-pointer select-none">Переназначить</summary>
                <form action={updateHomeworkAssignment.bind(null, hw.id)} className="flex gap-2 mt-3">
                  <select name="assigned_phone" defaultValue={hw.assigned_phone ?? ''} className={inputClass}>
                    <option value="">Всем ученикам</option>
                    {students.map((s) => (
                      <option key={s.phone} value={s.phone}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button className="btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0">
                    Сохранить
                  </button>
                </form>
              </details>
            </div>
          ))}
          {homework?.length === 0 && <p className="text-gray-400 text-sm">Заданий пока нет</p>}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Последние ответы учеников</h2>
        <div className="space-y-2">
          {submissions?.map((s) => (
            <div key={s.id} className="bg-surface rounded-xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900">{s.phone}</p>
                {s.ai_score && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">
                    {s.ai_score}
                  </span>
                )}
              </div>
              <ExpandableText text={s.answer_text} buttonLabel="Развернуть ответ" />
              {s.ai_feedback && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Проверка ИИ</p>
                  <ExpandableText text={s.ai_feedback} buttonLabel="Развернуть комментарий" />
                </div>
              )}
            </div>
          ))}
          {submissions?.length === 0 && <p className="text-gray-400 text-sm">Ответов пока нет</p>}
        </div>
      </section>
    </div>
  )
}
