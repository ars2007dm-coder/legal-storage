/**
 * Creates a link-only archive of official documents from olimpiada.ru.
 * It never downloads, stores, or extracts PDF contents.
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run after sql/fsmo_lite_database_v17_olympiad_archive.sql:
 *   npm run import:olimpiada
 */
import { createClient } from '@supabase/supabase-js'

const source = 'https://olimpiada.ru'
const years = [2020, 2021, 2022, 2023, 2024, 2025]
const grades = [5, 6, 7, 8, 9, 10, 11]
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before importing.')
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

const decode = (value) => value
  .replace(/&amp;/g, '&')
  .replace(/&#x2F;/g, '/')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const absoluteUrl = (href) => new URL(href, source).href

function stageAt(html, position) {
  const headings = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)]
    .filter((match) => match.index < position)
    .map((match) => decode(match[1]).toLowerCase())
  const heading = headings.at(-1) || ''
  if (heading.includes('школьн')) return 'school'
  if (heading.includes('муниципальн')) return 'municipal'
  if (heading.includes('региональн')) return 'regional'
  if (heading.includes('заключительн')) return 'final'
  return 'archive'
}

function extractPdfPairs(html, year, grade) {
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ href: absoluteUrl(decode(match[1])), label: decode(match[2]).toLowerCase(), position: match.index }))
    .filter((anchor) => /\.(pdf)(?:[?#]|$)/i.test(anchor.href))
    .filter((anchor) => /(задани|ответ|решени|критери)/.test(anchor.label))

  const rows = []
  for (let i = 0; i < anchors.length; i += 1) {
    const task = anchors[i]
    if (!/задани/.test(task.label)) continue
    const next = anchors[i + 1]
    const answers = next && /(ответ|решени|критери)/.test(next.label) ? next.href : null
    const stage = stageAt(html, task.position)
    rows.push({
      title: `ВсОШ по праву — ${grade} класс, ${stageLabel(stage)}, ${year}`,
      preview: 'Официальный файл задания: открывается у первоисточника.',
      full_text: 'На ФСМО размещена карточка с прямой официальной ссылкой. Текст и файл задания не копируются.',
      year,
      grade,
      stage,
      difficulty: 'medium',
      category: 'other',
      source_name: 'Олимпиада.ру / официальный организатор',
      source_url: task.href,
      answers_url: answers,
      external_only: true,
    })
  }
  return rows
}

function stageLabel(stage) {
  return ({ school: 'школьный этап', municipal: 'муниципальный этап', regional: 'региональный этап', final: 'заключительный этап', archive: 'архив' })[stage]
}

async function knownUrls(urls) {
  const { data, error } = await supabase.from('tasks').select('source_url').in('source_url', urls)
  if (error) throw error
  return new Set((data || []).map((row) => row.source_url))
}

let checked = 0
let found = 0
let inserted = 0
let skipped = 0
const errors = []

for (const year of years) {
  for (const grade of grades) {
    const archiveUrl = `${source}/activity/87/tasks/${year}?class=${grade}`
    checked += 1
    try {
      const response = await fetch(archiveUrl, { headers: { 'User-Agent': 'FSMO-link-archive/1.0' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const rows = extractPdfPairs(await response.text(), year, grade)
      const uniqueRows = [...new Map(rows.map((row) => [row.source_url, row])).values()]
      found += uniqueRows.length
      if (uniqueRows.length === 0) {
        console.log(`No direct PDF links: ${year}, grade ${grade}`)
        continue
      }
      const existing = await knownUrls(uniqueRows.map((row) => row.source_url))
      const newRows = uniqueRows.filter((row) => !existing.has(row.source_url))
      skipped += uniqueRows.length - newRows.length
      if (newRows.length) {
        const { error } = await supabase.from('tasks').insert(newRows)
        if (error) throw error
        inserted += newRows.length
      }
      console.log(`${year}, grade ${grade}: ${newRows.length} added, ${uniqueRows.length - newRows.length} already existed`)
    } catch (error) {
      errors.push({ year, grade, error: error instanceof Error ? error.message : String(error) })
      console.error(`Failed ${year}, grade ${grade}:`, error)
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

console.log(JSON.stringify({ checked, found, inserted, skipped, errors }, null, 2))
if (errors.length) process.exitCode = 1
