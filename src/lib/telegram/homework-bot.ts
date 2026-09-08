import { createAdminClient } from '@/lib/supabase/admin'
import { answerCallbackQuery, callTelegram, escapeHtml, sendMessage } from './api'
import { getTelegramConfig } from './config'
import type {
  DraftStep,
  HomeworkDraftData,
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
  TelegramUser,
} from './types'

const START_BUTTON = 'Отправить домашнее задание'
const SKIP_BUTTON = 'Пропустить'

const mainKeyboard = {
  keyboard: [[{ text: START_BUTTON }]],
  resize_keyboard: true,
}

const skipKeyboard = {
  keyboard: [[{ text: SKIP_BUTTON }]],
  resize_keyboard: true,
  one_time_keyboard: true,
}

function displayName(user: TelegramUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ')
}

function valueOrDash(value?: string) {
  return value?.trim() || '—'
}

function isTooLong(value: string | undefined, max: number) {
  return Boolean(value && value.length > max)
}

function summary(data: HomeworkDraftData, user?: TelegramUser) {
  const teacher = user
    ? `${escapeHtml(displayName(user))}${user.username ? ` (@${escapeHtml(user.username)})` : ''}`
    : undefined

  return [
    '<b>Домашнее задание</b>',
    teacher ? `<b>Преподаватель:</b> ${teacher}` : undefined,
    `<b>Предмет:</b> ${escapeHtml(valueOrDash(data.subject))}`,
    `<b>Группа:</b> ${escapeHtml(valueOrDash(data.student_group))}`,
    `<b>Задание:</b>\n${escapeHtml(valueOrDash(data.assignment_text))}`,
    `<b>Дедлайн:</b> ${escapeHtml(valueOrDash(data.deadline))}`,
    `<b>Комментарий:</b> ${escapeHtml(valueOrDash(data.comment))}`,
    `<b>Вложение:</b> ${data.attachment ? escapeHtml(data.attachment.file_name || data.attachment.type) : '—'}`,
  ]
    .filter(Boolean)
    .join('\n')
}

async function getDraft(telegramUserId: number) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('teacher_homework_drafts')
    .select('step, data')
    .eq('telegram_user_id', telegramUserId)
    .maybeSingle()

  if (error) throw error
  return data as { step: DraftStep; data: HomeworkDraftData } | null
}

async function saveDraft(
  telegramUserId: number,
  step: DraftStep,
  data: HomeworkDraftData
) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('teacher_homework_drafts').upsert(
    {
      telegram_user_id: telegramUserId,
      step,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'telegram_user_id' }
  )
  if (error) throw error
}

async function deleteDraft(telegramUserId: number) {
  const { error } = await createAdminClient()
    .from('teacher_homework_drafts')
    .delete()
    .eq('telegram_user_id', telegramUserId)
  if (error) throw error
}

async function begin(chatId: number, userId: number, token: string) {
  await saveDraft(userId, 'subject', {})
  await sendMessage(token, chatId, 'Введите предмет или дисциплину:', {
    remove_keyboard: true,
  })
}

function attachmentFrom(message: TelegramMessage) {
  if (message.document) {
    const document = message.document
    const supported =
      document.mime_type === 'application/pdf' ||
      document.mime_type?.startsWith('image/')
    if (!supported) return { unsupported: true as const }
    return {
      attachment: {
        type: 'document' as const,
        file_id: document.file_id,
        file_unique_id: document.file_unique_id,
        file_name: document.file_name,
        mime_type: document.mime_type,
        file_size: document.file_size,
      },
    }
  }

  const photo = message.photo?.at(-1)
  if (photo) {
    return {
      attachment: {
        type: 'photo' as const,
        file_id: photo.file_id,
        file_unique_id: photo.file_unique_id,
        mime_type: 'image/jpeg',
        file_size: photo.file_size,
      },
    }
  }

  return null
}

async function showConfirmation(
  token: string,
  chatId: number,
  userId: number,
  data: HomeworkDraftData
) {
  await saveDraft(userId, 'confirmation', data)
  await sendMessage(token, chatId, `${summary(data)}\n\nВсё верно?`, {
    inline_keyboard: [
      [{ text: 'Отправить', callback_data: 'homework:confirm' }],
      [{ text: 'Отмена', callback_data: 'homework:cancel' }],
    ],
  })
}

async function handleMessage(message: TelegramMessage) {
  const config = getTelegramConfig()
  const user = message.from
  if (!user) return

  if (message.chat.type !== 'private') {
    await sendMessage(config.token, message.chat.id, 'Отправлять задания можно только в личном чате с ботом.')
    return
  }

  if (!config.allowedTeacherIds.has(String(user.id))) {
    await sendMessage(config.token, message.chat.id, 'Доступ к боту не разрешён.')
    return
  }

  const text = message.text?.trim()
  if (text === '/start') {
    await deleteDraft(user.id)
    await sendMessage(
      config.token,
      message.chat.id,
      `Здравствуйте, ${escapeHtml(user.first_name)}! Здесь можно передать домашнее задание администратору.`,
      mainKeyboard
    )
    return
  }

  if (text === '/cancel') {
    await deleteDraft(user.id)
    await sendMessage(config.token, message.chat.id, 'Отправка отменена.', mainKeyboard)
    return
  }

  if (text === START_BUTTON) {
    await begin(message.chat.id, user.id, config.token)
    return
  }

  const draft = await getDraft(user.id)
  if (!draft) {
    await sendMessage(config.token, message.chat.id, 'Нажмите кнопку, чтобы начать.', mainKeyboard)
    return
  }

  const data = { ...draft.data }
  if (draft.step === 'subject') {
    if (!text) return sendMessage(config.token, message.chat.id, 'Введите предмет текстом.')
    if (isTooLong(text, 200)) return sendMessage(config.token, message.chat.id, 'Название предмета должно быть не длиннее 200 символов.')
    data.subject = text
    await saveDraft(user.id, 'student_group', data)
    await sendMessage(config.token, message.chat.id, 'Введите группу или класс:')
    return
  }

  if (draft.step === 'student_group') {
    if (!text) return sendMessage(config.token, message.chat.id, 'Введите группу текстом.')
    if (isTooLong(text, 100)) return sendMessage(config.token, message.chat.id, 'Название группы должно быть не длиннее 100 символов.')
    data.student_group = text
    await saveDraft(user.id, 'assignment_text', data)
    await sendMessage(config.token, message.chat.id, 'Введите текст домашнего задания:')
    return
  }

  if (draft.step === 'assignment_text') {
    if (!text) return sendMessage(config.token, message.chat.id, 'Введите задание текстом.')
    if (isTooLong(text, 2500)) return sendMessage(config.token, message.chat.id, 'Текст задания должен быть не длиннее 2500 символов.')
    data.assignment_text = text
    await saveDraft(user.id, 'deadline', data)
    await sendMessage(config.token, message.chat.id, 'Введите дедлайн или нажмите «Пропустить»:', skipKeyboard)
    return
  }

  if (draft.step === 'deadline') {
    if (!text) return sendMessage(config.token, message.chat.id, 'Введите дедлайн текстом или нажмите «Пропустить».', skipKeyboard)
    if (isTooLong(text, 200)) return sendMessage(config.token, message.chat.id, 'Дедлайн должен быть не длиннее 200 символов.', skipKeyboard)
    data.deadline = text === SKIP_BUTTON || text === '/skip' ? undefined : text
    await saveDraft(user.id, 'comment', data)
    await sendMessage(config.token, message.chat.id, 'Добавьте комментарий или нажмите «Пропустить»:', skipKeyboard)
    return
  }

  if (draft.step === 'comment') {
    if (!text) return sendMessage(config.token, message.chat.id, 'Введите комментарий текстом или нажмите «Пропустить».', skipKeyboard)
    if (isTooLong(text, 600)) return sendMessage(config.token, message.chat.id, 'Комментарий должен быть не длиннее 600 символов.', skipKeyboard)
    data.comment = text === SKIP_BUTTON || text === '/skip' ? undefined : text
    await saveDraft(user.id, 'attachment', data)
    await sendMessage(config.token, message.chat.id, 'Прикрепите фото или PDF/изображение как документ либо нажмите «Пропустить».', skipKeyboard)
    return
  }

  if (draft.step === 'attachment') {
    if (text === SKIP_BUTTON || text === '/skip') {
      await showConfirmation(config.token, message.chat.id, user.id, data)
      return
    }

    const result = attachmentFrom(message)
    if (result?.unsupported) {
      await sendMessage(config.token, message.chat.id, 'Поддерживаются фото, PDF и изображения. Попробуйте ещё раз или нажмите «Пропустить».', skipKeyboard)
      return
    }
    if (!result?.attachment) {
      await sendMessage(config.token, message.chat.id, 'Прикрепите фото/PDF или нажмите «Пропустить».', skipKeyboard)
      return
    }
    data.attachment = result.attachment
    await showConfirmation(config.token, message.chat.id, user.id, data)
    return
  }

  await sendMessage(config.token, message.chat.id, 'Подтвердите отправку кнопкой под сообщением или отмените командой /cancel.')
}

async function sendSubmissionToAdmin(
  token: string,
  adminChatId: string,
  id: string,
  data: HomeworkDraftData,
  user: TelegramUser
) {
  const text = `${summary(data, user)}\n\n<b>Статус:</b> новая`
  const replyMarkup = {
    inline_keyboard: [[
      { text: 'Добавлено на сайт', callback_data: `submission:${id}:added` },
      { text: 'Отклонить', callback_data: `submission:${id}:rejected` },
    ]],
  }

  if (data.attachment?.type === 'photo') {
    await callTelegram<{ message_id: number }>(token, 'sendPhoto', {
      chat_id: adminChatId,
      photo: data.attachment.file_id,
      caption: 'Вложение к новой заявке на домашнее задание',
    })
  }
  if (data.attachment?.type === 'document') {
    await callTelegram<{ message_id: number }>(token, 'sendDocument', {
      chat_id: adminChatId,
      document: data.attachment.file_id,
      caption: 'Вложение к новой заявке на домашнее задание',
    })
  }
  return sendMessage(token, adminChatId, text, replyMarkup)
}

async function confirmSubmission(callback: TelegramCallbackQuery, updateId: number) {
  const config = getTelegramConfig()
  const message = callback.message
  if (
    !message ||
    message.chat.type !== 'private' ||
    !config.allowedTeacherIds.has(String(callback.from.id))
  ) {
    await answerCallbackQuery(config.token, callback.id, 'Доступ запрещён')
    return
  }

  const draft = await getDraft(callback.from.id)
  if (!draft || draft.step !== 'confirmation') {
    await answerCallbackQuery(config.token, callback.id, 'Эта форма уже обработана')
    return
  }

  const attachment = draft.data.attachment
  const supabase = createAdminClient()
  const row = {
    telegram_update_id: updateId,
    telegram_user_id: callback.from.id,
    telegram_username: callback.from.username || null,
    teacher_name: displayName(callback.from),
    subject: draft.data.subject,
    student_group: draft.data.student_group,
    assignment_text: draft.data.assignment_text,
    deadline: draft.data.deadline || null,
    comment: draft.data.comment || null,
    file_type: attachment?.type || null,
    file_id: attachment?.file_id || null,
    file_unique_id: attachment?.file_unique_id || null,
    file_name: attachment?.file_name || null,
    file_mime_type: attachment?.mime_type || null,
    file_size: attachment?.file_size || null,
    status: 'new',
  }

  const { error: insertError } = await supabase
    .from('teacher_homework_submissions')
    .upsert(row, { onConflict: 'telegram_update_id', ignoreDuplicates: true })
  if (insertError) throw insertError

  const { data: submission, error: selectError } = await supabase
    .from('teacher_homework_submissions')
    .select('id, admin_message_id')
    .eq('telegram_update_id', updateId)
    .single()
  if (selectError) throw selectError

  if (submission.admin_message_id) {
    await deleteDraft(callback.from.id)
    await answerCallbackQuery(config.token, callback.id, 'Эта заявка уже отправлена')
    return
  }

  try {
    const adminMessage = await sendSubmissionToAdmin(
      config.token,
      config.adminChatId,
      submission.id,
      draft.data,
      callback.from
    )
    await supabase
      .from('teacher_homework_submissions')
      .update({ admin_message_id: adminMessage.message_id })
      .eq('id', submission.id)
  } catch (error) {
    console.error('[telegram-homework] Failed to notify admin', { error, submissionId: submission.id })
    throw error
  }

  await deleteDraft(callback.from.id)
  await answerCallbackQuery(config.token, callback.id, 'Отправлено администратору')
  await sendMessage(config.token, message.chat.id, 'Задание отправлено администратору. Публикация на сайте выполняется вручную.', mainKeyboard)
}

async function cancelSubmission(callback: TelegramCallbackQuery) {
  const config = getTelegramConfig()
  await deleteDraft(callback.from.id)
  await answerCallbackQuery(config.token, callback.id, 'Отменено')
  if (callback.message) {
    await sendMessage(config.token, callback.message.chat.id, 'Отправка отменена.', mainKeyboard)
  }
}

async function updateStatus(callback: TelegramCallbackQuery, id: string, status: 'added' | 'rejected') {
  const config = getTelegramConfig()
  if (!callback.message || String(callback.message.chat.id) !== config.adminChatId) {
    await answerCallbackQuery(config.token, callback.id, 'Действие разрешено только в админ-чате')
    return
  }

  const { data, error } = await createAdminClient()
    .from('teacher_homework_submissions')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by_telegram_user_id: callback.from.id,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) {
    await answerCallbackQuery(config.token, callback.id, 'Заявка не найдена')
    return
  }

  await callTelegram(config.token, 'editMessageReplyMarkup', {
    chat_id: callback.message.chat.id,
    message_id: callback.message.message_id,
    reply_markup: { inline_keyboard: [] },
  })
  await answerCallbackQuery(config.token, callback.id, status === 'added' ? 'Отмечено как добавленное' : 'Заявка отклонена')
  await sendMessage(
    config.token,
    callback.message.chat.id,
    `${status === 'added' ? '✅ Добавлено на сайт' : '❌ Отклонено'} · заявка ${escapeHtml(id)}`
  )
}

async function handleCallback(callback: TelegramCallbackQuery, updateId: number) {
  if (callback.data === 'homework:confirm') return confirmSubmission(callback, updateId)
  if (callback.data === 'homework:cancel') return cancelSubmission(callback)

  const match = callback.data?.match(/^submission:([0-9a-f-]{36}):(added|rejected)$/)
  if (match) return updateStatus(callback, match[1], match[2] as 'added' | 'rejected')

  const { token } = getTelegramConfig()
  await answerCallbackQuery(token, callback.id, 'Неизвестное действие')
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (update.callback_query) {
    await handleCallback(update.callback_query, update.update_id)
  } else if (update.message) {
    await handleMessage(update.message)
  }
}
