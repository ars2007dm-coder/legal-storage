import Link from 'next/link'
import { ExternalLink, PlayCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import FavoriteButton from '@/components/FavoriteButton'
import { categoryLabels, difficultyLabels, stageLabels } from '@/lib/labels'
import type { Task, Video } from '@/types/database'

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', params.id)
    .single<Task>()

  if (!task) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-gray-400">Задача не найдена</p>
      </div>
    )
  }

  // Связанные НПА через таблицу task_refs
  const { data: taskRefs } = await supabase
    .from('task_refs')
    .select('quote, pages, refs(id, title, abbr, official_url)')
    .eq('task_id', task.id)

  // Связанные видеоразборы
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('task_id', task.id)

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/tasks" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Назад к задачам
        </Link>

        <div className="bg-surface rounded-2xl border p-6 sm:p-8">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${difficultyLabels[task.difficulty]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                {difficultyLabels[task.difficulty]?.label ?? task.difficulty}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                {categoryLabels[task.category]?.label ?? task.category}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">
                {stageLabels[task.stage]?.label ?? task.stage}{task.year ? ` · ${task.year}` : ''}
              </span>
            </div>
            <FavoriteButton itemType="task" itemId={task.id} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">{task.title}</h1>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{task.full_text}</p>

          {taskRefs && taskRefs.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h2 className="font-semibold text-gray-900 mb-3">Связанные нормативные акты</h2>
              <div className="space-y-2">
                {taskRefs.map((tr: any, i: number) => (
                  <div key={i} className="text-sm bg-gray-50 rounded-lg p-3">
                    <a
                      href={tr.refs?.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-700 hover:underline inline-flex items-center gap-1"
                    >
                      {tr.refs?.abbr ?? tr.refs?.title} <ExternalLink className="w-3 h-3" />
                    </a>
                    {tr.pages && <span className="text-gray-400"> · ст. {tr.pages}</span>}
                    {tr.quote && <p className="text-gray-500 mt-1 italic">«{tr.quote}»</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos && videos.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h2 className="font-semibold text-gray-900 mb-3">Видеоразборы</h2>
              <div className="space-y-2">
                {videos.map((v: Video) => (
                  <a
                    key={v.id}
                    href={v.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100"
                  >
                    <PlayCircle className="w-5 h-5 text-primary-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{v.title}</p>
                      {v.teacher_name && <p className="text-xs text-gray-500">{v.teacher_name}</p>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
