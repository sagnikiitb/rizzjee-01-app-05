'use client'

import { CHAT_ID } from '@/lib/constants'
import { JSONValue } from 'ai'
import { useChat } from 'ai/react'
import { BookOpen } from 'lucide-react'
import React from 'react'
import { CollapsibleMessage } from './collapsible-message'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

export interface WikipediaReferencesProps {
  annotations: JSONValue[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

interface WikipediaAnnotation extends Record<string, JSONValue> {
  type: 'wikipedia-references'
  data: {
    annotations: Array<{
      title: string
      url: string
      confidence?: number
    }>
  }
}

export const WikipediaReferences: React.FC<WikipediaReferencesProps> = ({
  annotations,
  isOpen,
  onOpenChange
}) => {
  const { isLoading } = useChat({
    id: CHAT_ID
  })

  if (!annotations) {
    return null
  }

  const lastWikipediaAnnotation = annotations[
    annotations.length - 1
  ] as WikipediaAnnotation

  const header = (
    <div className="flex items-center gap-1">
      <BookOpen size={16} />
      <div>Wikipedia References</div>
    </div>
  )

  const wikipediaRefs = lastWikipediaAnnotation?.data
  if ((!wikipediaRefs || !wikipediaRefs.annotations) && !isLoading) {
    return null
  }

  if (wikipediaRefs.annotations.length === 0 && isLoading) {
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
      <div className="flex flex-wrap">
        {Array.isArray(wikipediaRefs.annotations) ? (
          wikipediaRefs.annotations
            ?.filter(item => item?.title !== '')
            .map((item, index) => (
              <div className="flex items-start w-full" key={index}>
                <BookOpen className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-accent-foreground/50" />
                <Button
                  variant="link"
                  className="flex-1 justify-start px-0 py-1 h-fit font-semibold text-accent-foreground/50 whitespace-normal text-left"
                  onClick={() => window.open(item.url, '_blank')}
                >
                  {item.title}
                </Button>
              </div>
            ))
        ) : (
          <div>No references found</div>
        )}
      </div>
    </CollapsibleMessage>
  )
}

export default WikipediaReferences
