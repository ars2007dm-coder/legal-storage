import { ClipboardList, Trash2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createTask, updateTask, deleteTask } from '../actions'
import { categoryLabels, stageLabels, difficultyLabels } from '@/lib/labels'

const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300'
const labelClass = 'text-xs font-medium text-gray-500 mb-1 block'

export default async function AdminTasksPage() {
  const supabase = createAdminClient()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10 space-y-8">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-primary-600" />
        <h1 className="text-xl font-bold text-gray-900">Задачи</h1>
      </div>

      <section className="bg-surface rounded-xl border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Новая олимпиадная задача</h2>
        <form action={createTask} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Название</label>
            <input name="title" required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Краткое описание (превью)</label>
            <input name="preview" required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Полный текст задачи</label>
            <textarea name="full_text" required rows={5} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Год</label>
            <input name="year" type="number" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Этап</label>
            <select name="stage" required className={inputClass}>
              {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Сложность</label>
            <select name="difficulty" required className={inputClass}>
              {Object.entries(difficultyLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Категория</label>
            <select name="category" required className={inputClass}>
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button className="btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg">
              Добавить задачу
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Список задач</h2>
        <div className="space-y-2">
          {tasks?.map((task) => (
            <div key={task.id} className="bg-surface rounded-xl border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">{task.preview}</p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                      {stageLabels[task.stage]?.label ?? task.stage}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                      {difficultyLabels[task.difficulty]?.label ?? task.difficulty}
                    </span>
                  </div>
                </div>
                <form action={deleteTask.bind(null, task.id)}>
                  <button className="text-sm text-red-600 hover:underline shrink-0">Удалить</button>
                </form>
              </div>

              <details className="mt-3">
                <summary className="text-sm text-primary-600 cursor-pointer select-none">Редактировать</summary>
                <form action={updateTask.bind(null, task.id)} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Название</label>
                    <input name="title" defaultValue={task.title} required className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Краткое описание (превью)</label>
                    <input name="preview" defaultValue={task.preview} required className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Полный текст задачи</label>
                    <textarea name="full_text" defaultValue={task.full_text} required rows={5} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Год</label>
                    <input name="year" type="number" defaultValue={task.year ?? ''} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Этап</label>
                    <select name="stage" defaultValue={task.stage} required className={inputClass}>
                      {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Сложность</label>
                    <select name="difficulty" defaultValue={task.difficulty} required className={inputClass}>
                      {Object.entries(difficultyLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Категория</label>
                    <select name="category" defaultValue={task.category} required className={inputClass}>
                      {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button className="btn-gradient text-white text-sm font-medium px-4 py-2 rounded-lg">
                      Сохранить
                    </button>
                  </div>
                </form>
              </details>
            </div>
          ))}
          {tasks?.length === 0 && <p className="text-gray-400 text-sm">Задач пока нет</p>}
        </div>
      </section>
    </div>
  )
}