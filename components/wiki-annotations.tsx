'use client'

import { JSONValue } from 'ai'
import { BookText } from 'lucide-react'
import React from 'react'
import { CollapsibleMessage } from './collapsible-message'
import { WikiAnnotation, WikiAnnotationContent } from '@/lib/types' // Import the types we defined

export interface WikiAnnotationsProps {
  annotations: JSONValue[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const WikiAnnotations: React.FC<WikiAnnotationsProps> = ({
  annotations,
  isOpen,
  onOpenChange
}) => {
  if (!annotations || annotations.length === 0) {
    return null
  }

  // Safely type check and cast the annotation
  const lastAnnotation = annotations[annotations.length - 1]
  if (!lastAnnotation || typeof lastAnnotation !== 'object') {
    return null
  }

  // Type guard function to check if the annotation is a WikiAnnotationContent
  const isWikiAnnotation = (value: unknown): value is WikiAnnotationContent => {
    if (!value || typeof value !== 'object') return false
    const annotation = value as any
    return (
      annotation.type === 'wiki-annotations' &&
      Array.isArray(annotation.data) &&
      annotation.data.every(
        (item: any) =>
          item &&
          typeof item === 'object' &&
          typeof item.title === 'string' &&
          typeof item.url === 'string'
      )
    )
  }

  // Type check the annotation
  if (!isWikiAnnotation(lastAnnotation)) {
    return null
  }

  const wikiAnnotations = lastAnnotation.data

  if (wikiAnnotations.length === 0) {
    return null
  }

  const header = (
    <div className="flex items-center gap-1">
      <BookText size={16} />
      <div>Wikipedia References</div>
    </div>
  )

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
