import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ClipboardCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import HomeworkItem from '@/components/HomeworkItem'
import { normalizePhone } from '@/lib/normalizePhone'

export default async function HomeworkPage() {
  const studentPhoneRaw = cookies().get('fsmo_student_phone')?.value
  if (!studentPhoneRaw) {
    redirect('/verify')
  }
  const studentPhone = normalizePhone(studentPhoneRaw)

  const supabase = createClient()
  const { data: homework } = await supabase
    .from('homework_public')
    .select('*')
    .or(`assigned_phone.is.null,assigned_phone.eq.${studentPhone}`)
    .order('created_at', { ascending: false })

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardCheck className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Домашние задания</h1>
        </div>
        <p className="text-gray-500 mb-6">
          Отправьте ответ — его проверит ИИ и даст развёрнутую обратную связь
        </p>

        <div className="space-y-4">
          {homework?.map((hw) => (
            <HomeworkItem key={hw.id} homework={hw} />
          ))}
          {homework?.length === 0 && (
            <p className="text-gray-400 text-center py-10">Пока нет заданий</p>
          )}
        </div>
      </div>
    </div>
  )
}
