import { createAdminClient } from '@/lib/supabase/admin'
import { createHomework, deleteHomework, updateHomeworkAssignment } from '../actions'
import { normalizePhone } from '@/lib/normalizePhone'
import ExpandableText from '@/components/ExpandableText'
import { BookOpen, FolderOpen, MessageSquare, Plus, Users } from 'lucide-react'
import { DeleteControls, SubmitButton } from '@/components/homework-admin/FormControls'
import styles from './homework.module.css'

export default async function AdminHomeworkPage() {
  const supabase = createAdminClient()

  const [{ data: homework, error: homeworkError }, { data: submissions, error: submissionsError }, usersRes, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabase
        .from('homework')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('homework_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30),

      supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      }),

      supabase
        .from('profiles')
        .select('id, full_name, student_class'),
    ])

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  )

  // Только ученики с заполненным профилем и телефоном.
  const students = (usersRes.data?.users ?? [])
    .filter(
      (u) =>
        u.phone &&
        profileMap.get(u.id)?.full_name
    )
    .map((u) => {
      const profile = profileMap.get(u.id)!

      return {
        phone: normalizePhone(u.phone),
        label: `${profile.full_name}${
          profile.student_class
            ? ` (${profile.student_class} класс)`
            : ''
        }`,
      }
    })
    .sort((a, b) =>
      a.label.localeCompare(b.label, 'ru')
    )

  const studentLabel = (phone: string | null) => {
    if (!phone) return null

    const match = students.find(
      (s) => s.phone === normalizePhone(phone)
    )

    return match?.label ?? phone
  }

  const studentsUnavailable = Boolean(usersRes.error || profilesError)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}><BookOpen size={16} aria-hidden="true" /> Учебная мастерская</p>
        <h1 className={styles.title}>Домашние задания</h1>
        <p className={styles.subtitle}>Создавайте задания, назначайте их ученикам и просматривайте ответы с обратной связью.</p>
      </header>

      <div className={styles.workspace}>
        <section className={styles.panel} aria-labelledby="create-heading">
          <div className={styles.panelHeading}>
            <span className={styles.icon}><Plus size={20} aria-hidden="true" /></span>
            <div><h2 id="create-heading" className={styles.sectionTitle}>Новое задание</h2>
              <p className={styles.hint}>От условия — к самостоятельному решению</p></div>
          </div>
          <form action={createHomework}>
            <fieldset disabled={studentsUnavailable} className={styles.form}>
            <div><label htmlFor="homework-title" className={styles.label}>Название</label>
              <input id="homework-title" name="title" required className={styles.input} placeholder="Тема домашнего задания" /></div>
            <div><label htmlFor="homework-instructions" className={styles.label}>Условие / инструкция</label>
              <textarea id="homework-instructions" name="instructions" required rows={5} className={styles.input} aria-describedby="instructions-hint" />
              <p id="instructions-hint" className={styles.hint}>Этот текст увидит ученик, когда откроет папку.</p></div>
            <div className={styles.criteria}>
              <label htmlFor="homework-model-answer" className={styles.label}>Эталонный ответ / критерии для ИИ</label>
              <textarea id="homework-model-answer" name="model_answer" required rows={4} className={styles.input} aria-describedby="criteria-hint" />
              <p id="criteria-hint" className={styles.hint}>Ученик не видит это поле. Критерии используются при проверке ответа.</p>
            </div>
            <div><label htmlFor="homework-category" className={styles.label}>Категория <span className="text-gray-500">· необязательно</span></label>
              <input id="homework-category" name="category" className={styles.input} /></div>
            <div><label htmlFor="homework-assigned" className={styles.label}>Кому назначить</label>
              <select id="homework-assigned" name="assigned_phone" defaultValue="" disabled={studentsUnavailable} className={styles.input} aria-describedby="students-hint">
                <option value="">Всем ученикам</option>
                {students.map((student) => <option key={student.phone} value={student.phone}>{student.label}</option>)}
              </select>
              <p id="students-hint" className={styles.hint}>{studentsUnavailable
                ? 'Не удалось загрузить учеников. Обновите страницу, чтобы создать задание с правильным назначением.'
                : students.length === 0 ? 'Пока нет учеников с заполненными ФИО и телефоном. Можно назначить задание всем.' : 'Выберите одного ученика или оставьте задание доступным всем.'}</p>
            </div>
            {studentsUnavailable ? <p role="alert" className={styles.error}>Создание временно недоступно: список учеников не загружен.</p>
              : <SubmitButton pendingLabel="Добавляем…" className={`${styles.button} btn-gradient`}>Добавить задание</SubmitButton>}
            </fieldset>
          </form>
        </section>

        <section aria-labelledby="assignments-heading">
          <div className={styles.panelHeading}>
            <span className={styles.icon}><FolderOpen size={20} aria-hidden="true" /></span>
            <div><h2 id="assignments-heading" className={styles.sectionTitle}>Список заданий</h2><p className={styles.hint}>Условия и назначения в одном месте</p></div>
          </div>
          <div className={styles.list}>
            {homeworkError && <p role="alert" className={styles.error}>Не удалось загрузить задания. Обновите страницу, чтобы попробовать снова.</p>}
            {homework?.map((hw) => (
              <article key={hw.id} className={styles.card}>
                <h3 className={styles.cardTitle}>{hw.title}</h3>
                <ExpandableText text={hw.instructions} buttonLabel="Развернуть условие" />
                <div className={styles.meta}>
                  <span className={styles.badge}><Users size={13} aria-hidden="true" className="shrink-0" />{hw.assigned_phone ? studentLabel(hw.assigned_phone) : 'Всем ученикам'}</span>
                  {hw.category && <span className={styles.badge}>{hw.category}</span>}
                </div>
                <details className={styles.assignment}>
                  <summary>Переназначить</summary>
                  <form action={updateHomeworkAssignment.bind(null, hw.id)} className={styles.assignmentForm}>
                    <label htmlFor={`assignment-${hw.id}`} className={styles.label}>Кому назначить задание</label>
                    <div className={styles.assignmentRow}>
                      <select id={`assignment-${hw.id}`} name="assigned_phone" defaultValue={hw.assigned_phone ?? ''} disabled={studentsUnavailable} className={styles.input}>
                        <option value="">Всем ученикам</option>
                        {hw.assigned_phone && !students.some((student) => student.phone === hw.assigned_phone) && <option value={hw.assigned_phone}>{studentLabel(hw.assigned_phone)} · текущее назначение</option>}
                        {students.map((student) => <option key={student.phone} value={student.phone}>{student.label}</option>)}
                      </select>
                      {!studentsUnavailable && <SubmitButton pendingLabel="Сохраняем…" className={`${styles.button} btn-gradient`}>Сохранить</SubmitButton>}
                    </div>
                    {studentsUnavailable && <p role="alert" className={styles.error}>Список учеников не загружен. Обновите страницу перед переназначением.</p>}
                  </form>
                </details>
                <form action={deleteHomework.bind(null, hw.id)} className="mt-3"><DeleteControls title={hw.title} /></form>
              </article>
            ))}
            {!homeworkError && homework?.length === 0 && <p className={styles.empty}>Заданий пока нет.<br />Создайте первое задание в форме рядом.</p>}
          </div>
        </section>
      </div>

      <section className={styles.answers} aria-labelledby="answers-heading">
        <div className={styles.panelHeading}>
          <span className={styles.icon}><MessageSquare size={20} aria-hidden="true" /></span>
          <div><h2 id="answers-heading" className={styles.sectionTitle}>Последние ответы учеников</h2><p className={styles.hint}>До 30 последних ответов и комментарии ИИ</p></div>
        </div>
        {submissionsError && <p role="alert" className={styles.error}>Не удалось загрузить ответы. Обновите страницу, чтобы попробовать снова.</p>}
        <div className={styles.answerGrid}>
          {submissions?.map((submission) => (
            <article key={submission.id} className={styles.card}>
              <div className={styles.answerHeader}>
                <h3 className="text-sm font-medium text-gray-900">{submission.phone}</h3>
                {submission.ai_score && <span className={styles.badge}>Оценка: {submission.ai_score}</span>}
              </div>
              <p className={styles.label}>Ответ ученика</p>
              <ExpandableText text={submission.answer_text} buttonLabel="Развернуть ответ" />
              {submission.ai_feedback && <div className={styles.feedback}>
                <p className={styles.label}>Проверка ИИ</p>
                <ExpandableText text={submission.ai_feedback} buttonLabel="Развернуть комментарий" />
              </div>}
            </article>
          ))}
        </div>
        {!submissionsError && submissions?.length === 0 && <p className={styles.empty}>Ответов пока нет. Они появятся здесь, когда ученики отправят задания на проверку.</p>}
      </section>
    </div>
  )
}
