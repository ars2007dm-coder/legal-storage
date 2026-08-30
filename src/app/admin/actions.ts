'use server'

import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/normalizePhone'

function requireAdmin() {
  if (!isAdmin()) throw new Error('Нет доступа')
}

function randomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function approveRequest(id: string) {
  requireAdmin()
  const supabase = createAdminClient()
  const code = randomCode()
  await supabase
    .from('access_requests')
    .update({ status: 'approved', access_code: code, approved_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/requests')
}

export async function rejectRequest(id: string) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('access_requests').update({ status: 'rejected' }).eq('id', id)
  revalidatePath('/admin/requests')
}

// ---------- НПА ----------

export async function createRef(formData: FormData) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('refs').insert({
    doc_type: formData.get('doc_type'),
    title: formData.get('title'),
    abbr: formData.get('abbr') || null,
    status: formData.get('status'),
    official_url: formData.get('official_url'),
    category: formData.get('category'),
    year: formData.get('year') ? Number(formData.get('year')) : null,
  })
  revalidatePath('/npa')
}

export async function deleteRef(id: string) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('refs').delete().eq('id', id)
  revalidatePath('/npa')
  revalidatePath('/admin/npa')
}

// ---------- Книги ----------

export async function createBook(formData: FormData) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('books').insert({
    title: formData.get('title'),
    author: formData.get('author'),
    year: formData.get('year') ? Number(formData.get('year')) : null,
    publisher: formData.get('publisher') || null,
    pdf_url: formData.get('pdf_url') || null,
    cover_url: formData.get('cover_url') || null,
    type: formData.get('type'),
    category: formData.get('category'),
  })
  revalidatePath('/books')
}

export async function deleteBook(id: string) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('books').delete().eq('id', id)
  revalidatePath('/books')
  revalidatePath('/admin/books')
}

// ---------- Задачи ----------

export async function createTask(formData: FormData) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('tasks').insert({
    title: formData.get('title'),
    preview: formData.get('preview'),
    full_text: formData.get('full_text'),
    year: formData.get('year') ? Number(formData.get('year')) : null,
    stage: formData.get('stage'),
    difficulty: formData.get('difficulty'),
    category: formData.get('category'),
  })
  revalidatePath('/tasks')
  revalidatePath('/admin/tasks')
}

export async function updateTask(id: string, formData: FormData) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase
    .from('tasks')
    .update({
      title: formData.get('title'),
      preview: formData.get('preview'),
      full_text: formData.get('full_text'),
      year: formData.get('year') ? Number(formData.get('year')) : null,
      stage: formData.get('stage'),
      difficulty: formData.get('difficulty'),
      category: formData.get('category'),
    })
    .eq('id', id)
  revalidatePath('/tasks')
  revalidatePath('/admin/tasks')
}

export async function deleteTask(id: string) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('tasks').delete().eq('id', id)
  revalidatePath('/tasks')
  revalidatePath('/admin/tasks')
}

// ---------- Домашние задания ----------

export async function createHomework(formData: FormData) {
  requireAdmin()
  const supabase = createAdminClient()
  const assignedPhoneRaw = formData.get('assigned_phone') as string
  await supabase.from('homework').insert({
    title: formData.get('title'),
    instructions: formData.get('instructions'),
    model_answer: formData.get('model_answer'),
    category: formData.get('category') || null,
    assigned_phone: assignedPhoneRaw ? normalizePhone(assignedPhoneRaw) : null,
  })
  revalidatePath('/admin/homework')
  revalidatePath('/homework')
}

export async function deleteHomework(id: string) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('homework').delete().eq('id', id)
  revalidatePath('/admin/homework')
  revalidatePath('/homework')
}

export async function updateHomeworkAssignment(id: string, formData: FormData) {
  requireAdmin()
  const supabase = createAdminClient()
  const assignedPhoneRaw = formData.get('assigned_phone') as string
  await supabase
    .from('homework')
    .update({ assigned_phone: assignedPhoneRaw ? normalizePhone(assignedPhoneRaw) : null })
    .eq('id', id)
  revalidatePath('/admin/homework')
  revalidatePath('/homework')
}

// ---------- Видео ----------

export async function createVideo(formData: FormData) {
  requireAdmin()
  const supabase = createAdminClient()
  const taskId = formData.get('task_id')
  await supabase.from('videos').insert({
    title: formData.get('title'),
    video_url: formData.get('video_url'),
    teacher_name: formData.get('teacher_name') || null,
    duration: formData.get('duration') ? Number(formData.get('duration')) : null,
    task_id: taskId && taskId !== '' ? taskId : null,
  })
  revalidatePath('/admin/videos')
  revalidatePath('/tasks')
}

export async function deleteVideo(id: string) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('videos').delete().eq('id', id)
  revalidatePath('/admin/videos')
  revalidatePath('/tasks')
}

// ---------- Объявления ----------

export async function createAnnouncement(formData: FormData) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('announcements').insert({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  revalidatePath('/admin/announcements')
  revalidatePath('/')
}

export async function updateAnnouncement(id: string, formData: FormData) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase
    .from('announcements')
    .update({
      title: formData.get('title'),
      content: formData.get('content'),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  revalidatePath('/admin/announcements')
  revalidatePath('/')
}

export async function deleteAnnouncement(id: string) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('announcements').delete().eq('id', id)
  revalidatePath('/admin/announcements')
  revalidatePath('/')
}

// ---------- Дедлайны ----------

export async function createDeadline(formData: FormData) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('deadlines').insert({
    title: formData.get('title'),
    deadline_date: formData.get('deadline_date'),
    description: formData.get('description') || null,
  })
  revalidatePath('/admin/announcements')
  revalidatePath('/')
}

export async function deleteDeadline(id: string) {
  requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('deadlines').delete().eq('id', id)
  revalidatePath('/admin/announcements')
  revalidatePath('/')
}
