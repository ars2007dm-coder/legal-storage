type TelegramReplyMarkup = Record<string, unknown>

export async function callTelegram<T = unknown>(
  token: string,
  method: string,
  payload: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const body = (await response.json()) as {
    ok: boolean
    result?: T
    description?: string
  }

  if (!response.ok || !body.ok) {
    throw new Error(`Telegram ${method}: ${body.description || response.statusText}`)
  }

  return body.result as T
}

export function sendMessage(
  token: string,
  chatId: string | number,
  text: string,
  replyMarkup?: TelegramReplyMarkup
) {
  return callTelegram<{ message_id: number }>(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  })
}

export function answerCallbackQuery(token: string, callbackQueryId: string, text: string) {
  return callTelegram(token, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  })
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
