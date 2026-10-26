import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import styles from '@/components/Homework.module.css'
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
  const { data: homework, error } = await supabase
    .from('homework_public')
    .select('*')
    .or(`assigned_phone.is.null,assigned_phone.eq.${studentPhone}`)
    .order('created_at', { ascending: false })

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>От знаний к практике</span>
            <h1 className={styles.heading}>Домашние задания</h1>
            <p className={styles.subtitle}>
              Откройте папку, изучите условие и нажмите «Начать ДЗ».
              После отправки ИИ проверит ответ и поможет разобраться в решении.
            </p>
          </div>
          {!error && <span className={styles.count}>Доступно заданий: {homework?.length ?? 0}</span>}
        </header>

        {error ? (
          <div className={styles.empty} role="alert">
            <h2 className={styles.emptyTitle}>Не удалось загрузить задания</h2>
            <p>Попробуйте обновить страницу немного позже.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {homework?.map((hw) => (
              <HomeworkItem key={hw.id} homework={{
                id: hw.id,
                title: hw.title,
                instructions: hw.instructions,
                category: hw.category,
              }} />
            ))}
            {!homework?.length && (
              <div className={styles.empty}>
                <FolderOpen className="mx-auto text-primary-600" size={36} aria-hidden="true" />
                <h2 className={styles.emptyTitle}>Здесь появятся ваши задания</h2>
                <p>Когда преподаватель добавит домашнее задание, вы сможете открыть его папку и приступить к работе.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
