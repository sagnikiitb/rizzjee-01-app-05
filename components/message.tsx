'use client'

import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Citing } from './custom-link'
import { CodeBlock } from './ui/codeblock'
import { MemoizedReactMarkdown } from './ui/markdown'

// Add error boundary for LaTeX rendering
const LaTeXErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  try {
    return <>{children}</>
  } catch (error) {
    console.error('LaTeX Rendering Error:', error)
    return (
      <div className="latex-error p-2 text-sm text-red-500 bg-red-50 rounded">
        <p>Failed to render LaTeX expression</p>
      </div>
    )
  }
}

// Enhanced LaTeX preprocessing
const preprocessLaTeX = (content: string): string => {
  // Handle block equations
  let processedContent = content.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, equation) => `\n$$${equation.trim()}$$\n`
  )
  
  // Handle inline equations
  processedContent = processedContent.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, equation) => `$${equation.trim()}$`
  )
  
  // Handle align environments
  processedContent = processedContent
    .replace(/\\begin{align\*?}/g, '\\begin{aligned}')
    .replace(/\\end{align\*?}/g, '\\end{aligned}')
    
  // Normalize spacing around equations
  processedContent = processedContent
    .replace(/([^$])\$\$/g, '$1\n$$')
    .replace(/\$\$([^$])/g, '$$\n$1')
    .replace(/([^$])\$([^$])/g, '$1 $ $2')
    
  return processedContent
}

// Enhanced LaTeX detection
const containsLaTeX = (content: string): boolean => {
  const patterns = [
    /\\\[([\s\S]*?)\\\]/, // Display math
    /\\\(([\s\S]*?)\\\)/, // Inline math
    /\$\$([\s\S]*?)\$\$/, // Display math with $$
    /\$[^$\n]+\$/,        // Inline math with single $
    /\\begin\{[^}]+\}/    // Environment blocks
  ]
  
  return patterns.some(pattern => pattern.test(content))
}

export function BotMessage({
  message,
  className
}: {
  message: string
  className?: string
}) {
  const hasLaTeX = containsLaTeX(message || '')
  const processedContent = hasLaTeX ? preprocessLaTeX(message || '') : message

  return (
    <LaTeXErrorBoundary>
      <MemoizedReactMarkdown
        rehypePlugins={[
          [rehypeExternalLinks, { target: '_blank' }],
          [rehypeKatex, {
            strict: false,
            trust: true,
            throwOnError: false,
            maxSize: 500,
            maxExpand: 1000,
            minRuleThickness: 0.05
          }]
        ]}
        remarkPlugins={[remarkGfm, remarkMath]}
        className={cn(
          'prose-sm prose-neutral prose-a:text-accent-foreground/50',
          'math-content', // Add this class for styling
          className
        )}
        components={{
          code({ node, inline, className, children, ...props }) {
            if (children.length) {
              if (children[0] == '▍') {
                return (
                  <span className="mt-1 cursor-default animate-pulse">▍</span>
                )
              }
              children[0] = (children[0] as string).replace('`▍`', '▍')
            }

            const match = /language-(\w+)/.exec(className || '')

            if (inline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }

            return (
              <CodeBlock
                key={Math.random()}
                language={(match && match[1]) || ''}
                value={String(children).replace(/\n$/, '')}
                {...props}
              />
            )
          },
          a: Citing,
          // Add custom components for math blocks
          math: ({value}) => (
            <div className="math-block my-2 overflow-x-auto">
              {value}
            </div>
          ),
          inlineMath: ({value}) => (
            <span className="math-inline">
              {value}
            </span>
          )
        }}
      >
        {processedContent}
      </MemoizedReactMarkdown>
    </LaTeXErrorBoundary>
  )
}
