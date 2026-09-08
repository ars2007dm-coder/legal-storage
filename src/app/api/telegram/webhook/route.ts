import { NextRequest, NextResponse } from 'next/server'
import { getTelegramConfig } from '@/lib/telegram/config'
import { handleTelegramUpdate } from '@/lib/telegram/homework-bot'
import type { TelegramUpdate } from '@/lib/telegram/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let config: ReturnType<typeof getTelegramConfig>
  try {
    config = getTelegramConfig()
  } catch (error) {
    console.error('[telegram-webhook] Configuration error', error)
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  }

  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== config.webhookSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update = (await request.json()) as TelegramUpdate
    if (!Number.isSafeInteger(update.update_id)) {
      return NextResponse.json({ error: 'Invalid Telegram update' }, { status: 400 })
    }
    await handleTelegramUpdate(update)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[telegram-webhook] Update failed', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'telegram-homework-webhook' })
}
