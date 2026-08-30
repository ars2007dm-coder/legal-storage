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
  previewClassName = 'text-sm text-gray-500 line-clamp-2 whitespace-pre-wrap',
  fullClassName = 'text-sm text-gray-600 whitespace-pre-wrap',
  buttonLabel = 'Развернуть',
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <p className={expanded ? fullClassName : previewClassName}>{text}</p>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        aria-expanded={expanded}
      >
        {expanded ? 'Свернуть' : buttonLabel}
      </button>
    </div>
  )
}
