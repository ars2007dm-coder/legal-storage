function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function parseIdList(value: string) {
  return new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        if (!/^-?\d+$/.test(item)) {
          throw new Error('TELEGRAM_ALLOWED_TEACHER_IDS contains an invalid ID')
        }
        return item
      })
  )
}

export function getTelegramConfig() {
  const adminChatId = required('TELEGRAM_ADMIN_CHAT_ID')
  if (!/^-?\d+$/.test(adminChatId)) {
    throw new Error('TELEGRAM_ADMIN_CHAT_ID must be a Telegram chat ID')
  }

  const webhookSecret = required('TELEGRAM_WEBHOOK_SECRET')
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(webhookSecret)) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET has invalid characters or length')
  }

  return {
    token: required('TELEGRAM_BOT_TOKEN'),
    webhookSecret,
    adminChatId,
    allowedTeacherIds: parseIdList(required('TELEGRAM_ALLOWED_TEACHER_IDS')),
  }
}
