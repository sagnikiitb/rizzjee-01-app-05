'use client'

import { JSONValue } from 'ai'
import { BookText } from 'lucide-react'
import React from 'react'
import { CollapsibleMessage } from './collapsible-message'

export interface WikiAnnotationsProps {
  annotations: JSONValue[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

interface WikiAnnotation {
  title: string
  url: string
}

export const WikiAnnotations: React.FC<WikiAnnotationsProps> = ({
  annotations,
  isOpen,
  onOpenChange
}) => {
  if (!annotations) {
    return null
  }

  const lastWikiAnnotation = annotations[annotations.length - 1] as {
    type: 'wiki-annotations'
    data: WikiAnnotation[]
  }

  const header = (
    <div className="flex items-center gap-1">
      <BookText size={16} />
      <div>Wikipedia References</div>
    </div>
  )

  const wikiAnnotations = lastWikiAnnotation?.data
  if (!wikiAnnotations || wikiAnnotations.length === 0) {
    return null
  }

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={true}
      header={header}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      showIcon={false}
    >
      <div className="flex flex-wrap gap-2">
        {wikiAnnotations.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors"
          >
            {item.title}
          </a>
        ))}
      </div>
    </CollapsibleMessage>
  )
}

export default WikiAnnotations
