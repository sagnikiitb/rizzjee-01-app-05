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

// Convert Markdown-style math to LaTeX
const convertMarkdownToLaTeX = (text: string): string => {
  // Handle GitHub-flavored Markdown math blocks with ```math
  text = text.replace(
    /```math\s*([\s\S]*?)\s*```/g,
    (_, math) => `\n\\[\n${math.trim()}\n\\]\n`
  )

  // Handle inline math with single backticks and dollar signs
  text = text.replace(
    /`\$([^`]+)\$`/g,
    (_, math) => `\\(${math.trim()}\\)`
  )

  // Handle multi-line math blocks with triple backticks
  text = text.replace(
    /```\n\$\$([\s\S]*?)\$\$\n```/g,
    (_, math) => `\n\\[\n${math.trim()}\n\\]\n`
  )

  return text
}

// Enhanced preprocessing function
const preprocessMath = (content: string): string => {
  if (!content) return ''

  // First handle Markdown-style math
  let processedContent = convertMarkdownToLaTeX(content)

  // Look for potential plaintext math expressions
  const plainTextMathRegex = /([^$\\\n])([\d\w]+[\/\^_\*][\d\w]+|sqrt\([^)]+\)|\b(alpha|beta|gamma|delta|theta|pi|sigma|omega)\b)/g
  processedContent = processedContent.replace(plainTextMathRegex, (match, pre, expr) => {
    // Don't convert if it's already part of a LaTeX expression
    if (pre.endsWith('\\') || pre.endsWith('$')) return match
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
export function BotMessage({
  message,
  className
}: {
  message: string
  className?: string
}) {
  const hasMath = containsMath(message || '')
  const processedContent = hasMath ? preprocessMath(message || '') : message

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
          // Handle math blocks through the code component
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            
            // Handle math blocks
            if (match && match[1] === 'math') {
              return (
                <div className="math-block my-2 overflow-x-auto">
                  {String(children).replace(/\n$/, '')}
                </div>
              )
            }

            // Handle inline math (wrapped in single $)
            if (inline && String(children).startsWith('$') && String(children).endsWith('$')) {
              const mathContent = String(children).slice(1, -1)
              return (
                <span className="math-inline">
                  {mathContent}
                </span>
              )
            }

            // Default code handling
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
          }
        }}
      >
        {processedContent}
      </MemoizedReactMarkdown>
    </LaTeXErrorBoundary>
  )
}
// Scissor end
// Error boundary component (as defined in previous version)
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
