import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

// Проверяет, что запрос идёт от ученика с подтверждённым доступом
// (cookie ставится в /api/verify-access после ввода кода)

// ИИ-проверка через Groq (бесплатный API-ключ, без привязки карты,
// обычная регистрация по почте) — модель llama-3.3-70b-versatile.

export async function POST(req: NextRequest) {
  const studentPhone = cookies().get('fsmo_student_phone')?.value
  if (!studentPhone) {
    return NextResponse.json({ error: 'Нет доступа — подтвердите вход' }, { status: 401 })
  }

  const { homeworkId, answerText } = await req.json()
  if (!homeworkId || !answerText?.trim()) {
    return NextResponse.json({ error: 'Заполните ответ' }, { status: 400 })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'ИИ-проверка не настроена: нет GROQ_API_KEY на сервере' },
      { status: 500 }
    )
  }

  const supabase = createAdminClient()

  const { data: hw, error: hwError } = await supabase
    .from('homework')
    .select('title, instructions, model_answer')
    .eq('id', homeworkId)
    .single()

  if (hwError || !hw) {
    return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 })
  }

  const systemPrompt = `Ты — преподаватель права, который проверяет домашние задания школьников,
готовящихся к олимпиаде по праву (ФСМО). Тебе даны: условие задания, эталонный
ответ/критерии оценки (для тебя, ученику их не показывают) и ответ ученика.

Важно: эталонный ответ — это ОРИЕНТИР, а не единственно верная позиция.
Если ученик даёт другой вывод, но выстраивает его на реальных нормах права,
логично аргументирует и честно признаёт слабые места своей позиции —
это признак сильного юридического мышления и должно оцениваться высоко,
даже если вывод расходится с эталоном. Занижай оценку только за
фактические ошибки в нормах, слабую или нелогичную аргументацию,
или игнорирование ключевых фактов условия — а не просто за несовпадение
с формулировкой эталона.

Ответ дай на русском языке, в СТРОГО следующем порядке:
1. Итоговая оценка по 10-балльной шкале в формате "Оценка: X/10" (ставь
   её ПЕРВОЙ строкой, до всего остального)
2. Что в ответе верно и хорошо аргументировано
3. Что упущено, неверно, или могло бы быть аргументировано сильнее
4. Если ученик занял позицию, отличную от эталона — оцени, насколько
   она сама по себе юридически состоятельна, а не просто отметь расхождение

Будь конкретным и доброжелательным, как хороший учитель — не просто "верно/неверно".`

  const userPrompt = `Задание: ${hw.title}

Условие: ${hw.instructions}

Эталон/критерии (не показывать ученику дословно, использовать для оценки):
${hw.model_answer}

Ответ ученика:
${answerText}`

  try {
    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        max_tokens: 2500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!aiRes.ok) {
      const text = await aiRes.text()
      return NextResponse.json({ error: `Ошибка ИИ: ${text}` }, { status: 500 })
    }

    const aiData = await aiRes.json()
    const feedback = aiData.choices?.[0]?.message?.content ?? 'Не удалось получить ответ от ИИ'

    const scoreMatch = feedback.match(/Оценка:\s*(\d+\/10)/)
    const score = scoreMatch ? scoreMatch[1] : null

    await supabase.from('homework_submissions').insert({
      homework_id: homeworkId,
      phone: studentPhone,
      answer_text: answerText,
      ai_feedback: feedback,
      ai_score: score,
    })

    return NextResponse.json({ feedback, score })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}