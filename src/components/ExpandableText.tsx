'use client'

import { useState } from 'react'

interface ExpandableTextProps {
  text: string
  previewClassName?: string
  fullClassName?: string
  buttonLabel?: string
}

export default function ExpandableText({
  text,
  previewClassName = 'text-sm text-gray-500 whitespace-pre-wrap',
  fullClassName = 'text-sm text-gray-600 whitespace-pre-wrap',
  buttonLabel = 'Развернуть',
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)

  // Короткий текст нет смысла сворачивать
  const isLongText = text.length > 180 || text.split('\n').length > 3

  if (!isLongText) {
    return (
      <p className={fullClassName}>
        {text}
      </p>
    )
  }

  return (
    <div className="min-w-0">
      <div
        className={
          expanded
            ? fullClassName
            : `${previewClassName} line-clamp-2`
        }
      >
        {text}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-1 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        aria-expanded={expanded}
      >
        {expanded ? 'Свернуть' : buttonLabel}
      </button>
    </div>
  )
}