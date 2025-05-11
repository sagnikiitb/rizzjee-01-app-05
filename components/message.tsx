'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Components } from 'react-markdown'
import { Citing } from './custom-link'
import { CodeBlock } from './ui/codeblock'
import { MemoizedReactMarkdown } from './ui/markdown'
import { DetailedHTMLProps, HTMLAttributes } from 'react'

// Error boundary component
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

// URL detection regex - detects complete URLs 
const URL_REGEX = /(https?:\/\/[^\s]+)/g
const YOUTUBE_URL_REGEX = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]{11})/

// Function to convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url: string) => {
  const match = url.match(YOUTUBE_URL_REGEX)
  if (match) {
    // Extract the video ID
    const videoId = match[4]
    return `https://www.youtube.com/embed/${videoId}`
  }
  return url
}

// Function to check if URL is an image
const isImageUrl = (url: string) => {
  return /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i.test(url)
}

type CodeComponentProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  node?: any
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

export function BotMessage({
  message,
  className
}: {
  message: string
  className?: string
}) {
  // State to track rendered SVGs for matplotlib code
  const [renderedCode, setRenderedCode] = useState<Record<string, string>>({})

  // Process code snippets that contain matplotlib content
  useEffect(() => {
    // Find Python code blocks that use matplotlib
    const pythonMatplotlibRegex = /```(?:python|py)\n([\s\S]*?matplotlib[\s\S]*?)```/g
    let match
    
    const processMatplotlibCode = async () => {
      const newRenderedCode: Record<string, string> = {}
      
      // Find all matches in the content
      while ((match = pythonMatplotlibRegex.exec(message)) !== null) {
        const code = match[1]
        const codeKey = code.slice(0, 50) // Use first 50 chars as a key
        
        try {
          // Call backend service to convert matplotlib code to SVG
          const response = await fetch('/api/rizzjee-starplot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          })
          
          if (response.ok) {
            const data = await response.json()
            newRenderedCode[codeKey] = data.svg
          }
        } catch (error) {
          console.error('Error rendering matplotlib code:', error)
        }
      }
      
      if (Object.keys(newRenderedCode).length > 0) {
        setRenderedCode(newRenderedCode)
      }
    }
    
    if (message && message.includes('matplotlib')) {
      processMatplotlibCode()
    }
  }, [message])
  
  // Custom component for rendering code blocks
  const CodeComponent = ({ node, inline, className, children, ...props }: CodeComponentProps) => {
    const match = /language-(\w+)/.exec(className || '')
    const language = match && match[1] ? match[1] : ''
    const code = String(children).replace(/\n$/, '')
    
    // Check if this is a matplotlib code block that we've rendered
    if (language === 'python' || language === 'py') {
      if (code.includes('matplotlib')) {
        const codeKey = code.slice(0, 50) // Same key generation as in useEffect
        const svgContent = renderedCode[codeKey]
        
        if (svgContent) {
          // Return the rendered SVG instead of the code block
          return (
            <div className="matplotlib-output" dangerouslySetInnerHTML={{ __html: svgContent }} />
          )
        }
      }
    }
    
    // For all other code blocks, use the default CodeBlock component
    if (!inline && match) {
      return (
        <CodeBlock
          key={Math.random()}
          language={language}
          value={code}
          {...props}
        />
      )
    }
    
    return inline ? (
      <code className={className} {...props}>
        {children}
      </code>
    ) : (
      <CodeBlock
        key={Math.random()}
        language={'text'}
        value={code}
        {...props}
      />
    )
  }
  
  // Custom component for links - handles YouTube and image embeds
  const LinkComponent = ({ href, children, ...props }: any) => {
    if (!href) return <a {...props}>{children}</a>

    // Check if this is a YouTube URL
    if (YOUTUBE_URL_REGEX.test(href)) {
      const embedUrl = getYouTubeEmbedUrl(href)
      return (
        <div className="youtube-embed">
          <iframe 
            width="100%" 
            height="315" 
            src={embedUrl} 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen 
            title="Embedded YouTube video"
          />
        </div>
      )
    }
    
    // Check if this is an image URL
    if (isImageUrl(href)) {
      return (
        <div className="image-embed">
          <img src={href} alt={String(children) || "Embedded image"} style={{ maxWidth: '100%' }} />
        </div>
      )
    }
    
    // Default link rendering
    return <Citing href={href} {...props}>{children}</Citing>
  }

  return (
    <LaTeXErrorBoundary>
      <MemoizedReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
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
        className={cn(
          'prose-sm prose-neutral prose-a:text-accent-foreground/50',
          'math-content',
          className
        )}
        components={{
          code: CodeComponent as Components['code'],
          a: LinkComponent as Components['a']
        }}
      >
        {message}
      </MemoizedReactMarkdown>
    </LaTeXErrorBoundary>
  )
}
