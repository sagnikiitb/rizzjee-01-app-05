'use client'

import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Components } from 'react-markdown'
import { Citing } from './custom-link'
import { CodeBlock } from './ui/codeblock'
import { MemoizedReactMarkdown } from './ui/markdown'
import { ReactNode } from 'react'
import { DetailedHTMLProps, HTMLAttributes } from 'react'


// Common mathematical patterns in plaintext
const MATH_PATTERNS = {
  fractions: /(\d+)\/(\d+)/g,
  exponents: /(\w+)\^(\d+|\{\w+\})/g,
  squareRoot: /sqrt\(([^)]+)\)/g,
  subscripts: /(\w+)_(\d+|\{\w+\})/g,
  plusMinus: /\+\-/g,
  multiplicationDot: /(\d+|\})\s*\*\s*(\d+|\{)/g,
  greekLetters: {
    alpha: /\balpha\b/g,
    beta: /\bbeta\b/g,
    gamma: /\bgamma\b/g,
    delta: /\bdelta\b/g,
    theta: /\btheta\b/g,
    pi: /\bpi\b/g,
    sigma: /\bsigma\b/g,
    omega: /\bomega\b/g,
    lambda: /\blambda\b/g,
    zeta: /\bzeta\b/g,
    tau: /\btau\b/g,



    // Add more Greek letters as needed
  }
}

// Convert plaintext math to LaTeX
const convertPlainTextToLaTeX = (text: string): string => {
  // Handle fractions
  text = text.replace(MATH_PATTERNS.fractions, '\\frac{$1}{$2}')

  // Handle exponents
  text = text.replace(MATH_PATTERNS.exponents, '{$1}^{$2}')

  // Handle square roots
  text = text.replace(MATH_PATTERNS.squareRoot, '\\sqrt{$1}')

  // Handle subscripts
  text = text.replace(MATH_PATTERNS.subscripts, '{$1}_{$2}')

  // Handle plus-minus
  text = text.replace(MATH_PATTERNS.plusMinus, '\\pm ')

  // Handle multiplication dot
  text = text.replace(MATH_PATTERNS.multiplicationDot, '$1 \\cdot $2')

  // Handle Greek letters
  Object.entries(MATH_PATTERNS.greekLetters).forEach(([letter, pattern]) => {
    text = text.replace(pattern, `\\${letter}`)
  })

  return text
}



// Enhanced preprocessing function
const preprocessMath = (content: string): string => {
  if (!content) return ''

  // First handle Markdown-style math
  //let processedContent = convertMarkdownToLaTeX(content)
  //Simplify
  let processedContent = content
  // Look for potential plaintext math expressions
  const plainTextMathRegex = /([^$\\\n])([\d\w]+[\/\^_\*][\d\w]+|sqrt\([^)]+\)|\b(alpha|beta|gamma|delta|theta|pi|sigma|omega|lambda|zeta|tau)\b)/g;
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+|\S+\.(com|org|edu|co|in|io|net|gov|mil|us|uk|ca|au|de|fr|jp|ru|cn|br|it|nl|se|no|fi|dk|pl|ch|at|be|es|pt|gr|cz|hu|ro|nz|ie|il|za|ar|mx|cl|pe|co|ve|sg|my|ph|vn|sa|ae|eg|pk|ng)(?:\/[^\s]*)?/i;
  processedContent = processedContent.replace(plainTextMathRegex, (match, pre, expr) => {
    // Don't convert if it's already part of a LaTeX expression or if it's a URL
    if (pre.endsWith('\\') || pre.endsWith('$')) return match
    // Check if this potential math expression is part of a URL
    const testString = pre + expr;
    if (urlRegex.test(testString)) {
        return match; // It's part of a URL, don't convert
        }
          
    return `${pre}\\(${convertPlainTextToLaTeX(expr)}\\)`
  })

  // Handle existing LaTeX expressions
  processedContent = processedContent
    // Handle display math
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => `\n$$${equation.trim()}$$\n`)
    // Handle inline math
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, equation) => `$${equation.trim()}$`)
    // Handle align environments
    .replace(/\\begin{align\*?}/g, '\\begin{aligned}')
    .replace(/\\end{align\*?}/g, '\\end{aligned}')
    // Normalize spacing
    .replace(/([^$])\$\$/g, '$1\n$$')
    .replace(/\$\$([^$])/g, '$$\n$1')
    .replace(/([^$])\$([^$])/g, '$1 $ $2')

  return processedContent
}

// Enhanced math detection
const containsMath = (content: string): boolean => {
  if (!content) return false

  const patterns = [
    /\\\[([\s\S]*?)\\\]/,          // Display math
    /\\\(([\s\S]*?)\\\)/,          // Inline math
    /\$\$([\s\S]*?)\$\$/,          // Display math with $$
    /\$[^$\n]+\$/,                 // Inline math with single $
    /\\begin\{[^}]+\}/,            // Environment blocks
    /```math/,                      // Markdown math blocks
    /`\$[^`]+\$`/,                 // Markdown inline math
    /(\d+)\/(\d+)/,                // Fractions
    /(\w+)\^(\d+|\{\w+\})/,        // Exponents
    /sqrt\([^)]+\)/,               // Square roots
    /(\w+)_(\d+|\{\w+\})/,         // Subscripts
    /\b(alpha|beta|gamma|delta|theta|pi|sigma|omega)\b/ // Greek letters
  ]

  return patterns.some(pattern => pattern.test(content))
}
//Scissor start
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
  const hasMath = containsMath(message || '')
  const processedContent = hasMath ? preprocessMath(message || '') : message

  const CodeComponent = ({ node, inline, className, children, ...props }: CodeComponentProps) => {
       if (children && Array.isArray(children) && children.length > 0) {
      if (children[0] === '▍') {
        return (
          <span className="mt-1 cursor-default animate-pulse">▍</span>
        )
      }
      if (typeof children[0] === 'string') {
        children[0] = children[0].replace('`▍`', '▍')
      }
    }

    const match = /language-(\w+)/.exec(className || '')
    
    // Handle math blocks
    if (match && match[1] === 'math') {
      return (
        <div className="math-block my-2 overflow-x-auto">
          {String(children).replace(/\n$/, '')}
        </div>
      )
    }

    // Handle inline math
    if (inline && 
        typeof children === 'string' && 
        children.startsWith('$') && 
        children.endsWith('$')) {
      const mathContent = children.slice(1, -1)
      return (
        <span className="math-inline">
          {mathContent}
        </span>
      )
    }

    // Default inline code handling
    if (inline) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }

    // Default code block handling
    return (
      <CodeBlock
        key={Math.random()}
        language={(match && match[1]) || ''}
        value={String(children).replace(/\n$/, '')}
        {...props}
      />
    )
    // [Rest of the CodeComponent implementation remains the same]
  }

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
          'math-content',
          className
        )}
        components={{
          code: CodeComponent as Components['code'],
          a: Citing
        }}
      >
        {processedContent}
      </MemoizedReactMarkdown>
    </LaTeXErrorBoundary>
  )
}



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

//Scissor end
