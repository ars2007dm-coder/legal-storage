// Русификация значений из базы данных — единый справочник (раздел 7 брифа)

export const stageLabels: Record<string, { label: string }> = {
  school: { label: 'Школьный' },
  municipal: { label: 'Муниципальный' },
  regional: { label: 'Региональный' },
  final: { label: 'Заключительный' },
}

export const difficultyLabels: Record<string, { label: string; color: string }> = {
  easy: { label: 'Лёгкая', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Средняя', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Сложная', color: 'bg-red-100 text-red-700' },
}

export const docTypeLabels: Record<string, { label: string }> = {
  code: { label: 'Кодекс' },
  federal_law: { label: 'Федеральный закон' },
  plenum: { label: 'Постановление Пленума ВС' },
  order: { label: 'Постановление' },
}

export const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Действующий', color: 'bg-green-100 text-green-700' },
  inactive: { label: 'Утратил силу', color: 'bg-red-100 text-red-700' },
  draft: { label: 'Проект', color: 'bg-yellow-100 text-yellow-700' },
}

export const bookTypeLabels: Record<string, { label: string }> = {
  textbook: { label: 'Учебник' },
  commentary: { label: 'Комментарий' },
  casebook: { label: 'Кейс-бук' },
  monograph: { label: 'Монография' },
  article: { label: 'Статья' },
}

export const categoryLabels: Record<string, { label: string }> = {
  constitutional: { label: 'Конституционное право' },
  civil: { label: 'Гражданское право' },
  criminal: { label: 'Уголовное право' },
  admin: { label: 'Административное право' },
  process: { label: 'Процессуальное право' },
  tax: { label: 'Налоговое право' },
  labor: { label: 'Трудовое право' },
  family: { label: 'Семейное право' },
  land: { label: 'Земельное право' },
  business: { label: 'Корпоративное право' },
}
