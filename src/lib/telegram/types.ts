export type TelegramUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

export type TelegramChat = {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
}

export type TelegramDocument = {
  file_id: string
  file_unique_id: string
  file_name?: string
  mime_type?: string
  file_size?: number
}

export type TelegramPhotoSize = {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

export type TelegramMessage = {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  text?: string
  caption?: string
  document?: TelegramDocument
  photo?: TelegramPhotoSize[]
}

export type TelegramCallbackQuery = {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

export type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

export type HomeworkDraftData = {
  subject?: string
  student_group?: string
  assignment_text?: string
  deadline?: string
  comment?: string
  attachment?: {
    type: 'photo' | 'document'
    file_id: string
    file_unique_id: string
    file_name?: string
    mime_type?: string
    file_size?: number
  }
}

export type DraftStep =
  | 'subject'
  | 'student_group'
  | 'assignment_text'
  | 'deadline'
  | 'comment'
  | 'attachment'
  | 'confirmation'
