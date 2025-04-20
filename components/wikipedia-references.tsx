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
  console.log('[WikipediaReferences] Received annotations:', annotations);

  const { isLoading } = useChat({
    id: CHAT_ID
  })

  if (!annotations || annotations.length === 0) {
    console.log('[WikipediaReferences] No annotations available');
    return null;
  }

  const lastWikipediaAnnotation = annotations[
    annotations.length - 1
  ] as WikipediaAnnotation;
  
  console.log('[WikipediaReferences] Last Wikipedia annotation:', lastWikipediaAnnotation);

  const header = (
    <div className="flex items-center gap-1">
      <BookOpen size={16} />
      <div>Wikipedia References</div>
    </div>
  )

  const wikipediaRefs = lastWikipediaAnnotation?.data;
  console.log('[WikipediaReferences] Wikipedia refs:', wikipediaRefs);

  if ((!wikipediaRefs || !wikipediaRefs.annotations) && !isLoading) {
    console.log('[WikipediaReferences] No valid refs found and not loading');
    return null;
  }

  if (!wikipediaRefs?.annotations?.length && isLoading) {
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
