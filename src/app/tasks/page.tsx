import Link from 'next/link'
import { ClipboardList, Tag, Calendar, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import TaskFilters from '@/components/TaskFilters'
import FavoriteButton from '@/components/FavoriteButton'
import { categoryLabels, difficultyLabels, stageLabels } from '@/lib/labels'
import type { Task } from '@/types/database'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const supabase = createClient()
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })

  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`)
  if (searchParams.category) query = query.eq('category', searchParams.category)
  if (searchParams.difficulty) query = query.eq('difficulty', searchParams.difficulty)
  if (searchParams.stage) query = query.eq('stage', searchParams.stage)

  const { data: tasks, error } = await query

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Олимпиадные задачи</h1>
        </div>
        <p className="text-gray-500 mb-6">Реальные задания прошлых лет по этапам и сложности</p>

        <TaskFilters />

        {error && <p className="text-red-600 mb-4">Ошибка загрузки: {error.message}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tasks?.map((task: Task) => (
            <Link
              key={task.id}
              href={`/task/${task.id}`}
              className="bg-surface rounded-xl border p-5 hover:shadow-lg hover:border-primary-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      difficultyLabels[task.difficulty]?.color ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {difficultyLabels[task.difficulty]?.label ?? task.difficulty}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {categoryLabels[task.category]?.label ?? task.category}
                  </span>
                </div>
                <FavoriteButton itemType="task" itemId={task.id} className="-mt-1 -mr-1" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{task.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{task.preview}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {task.year ?? '—'}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5" /> {stageLabels[task.stage]?.label ?? task.stage}
                </span>
              </div>
            </Link>
          ))}
          {tasks?.length === 0 && (
            <p className="text-gray-400 text-center py-10 col-span-full">Ничего не найдено</p>
          )}
        </div>
      </div>
    </div>
  )
}
