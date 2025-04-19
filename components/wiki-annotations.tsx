'use client'

import { CHAT_ID } from '@/lib/constants'
import { JSONValue } from 'ai'
import { useChat } from 'ai/react'
import { Book, ArrowUpRight } from 'lucide-react'
import React from 'react'
import { CollapsibleMessage } from './collapsible-message'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

// Define the structure of a single wiki annotation
interface WikiAnnotation {
  title: string
  url: string
}

// Define the structure of the wiki annotations content
interface WikiAnnotationsContent {
  type: 'wiki-annotations'
  data: WikiAnnotation[]
}

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
  const { isLoading } = useChat({
    id: CHAT_ID
  })

  if (!annotations || annotations.length === 0) {
    return null
  }

  // Type guard to check if an unknown value is a WikiAnnotationsContent
  const isWikiAnnotationsContent = (value: unknown): value is WikiAnnotationsContent => {
    if (!value || typeof value !== 'object') return false
    const v = value as any
    return (
      v.type === 'wiki-annotations' &&
      Array.isArray(v.data) &&
      v.data.every(
        (item: any) =>
          item &&
          typeof item === 'object' &&
          typeof item.title === 'string' &&
          typeof item.url === 'string'
      )
    )
  }

  // Get the last annotation and verify its structure
  const lastAnnotation = annotations[annotations.length - 1]
  if (!isWikiAnnotationsContent(lastAnnotation)) {
    return null
  }

  const header = (
    <div className="flex items-center gap-1">
      <Book size={16} />
      <div>Wikipedia References</div>
    </div>
  )

  const wikiAnnotations = lastAnnotation.data
  if (!wikiAnnotations && !isLoading) {
    return null
  }

  if ((!wikiAnnotations || wikiAnnotations.length === 0) && isLoading) {
    return (
      <CollapsibleMessage
        role="assistant"
        isCollapsible={true}
        header={header}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <Skeleton className="w-full h-6" />
      </CollapsibleMessage>
    )
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
      <div className="flex flex-col space-y-2">
        {wikiAnnotations.map((item, index) => (
          <div className="flex items-start" key={index}>
            <ArrowUpRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-accent-foreground/50" />
            <Button
              variant="link"
              className="flex-1 justify-start px-0 py-1 h-fit font-semibold text-accent-foreground/50 whitespace-normal text-left"
              onClick={() => window.open(item.url, '_blank')}
            >
              {item.title}
            </Button>
          </div>
        ))}
      </div>
    </CollapsibleMessage>
  )
}

export default WikiAnnotations
