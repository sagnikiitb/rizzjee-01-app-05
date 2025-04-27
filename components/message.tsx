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

// URL pattern to detect and preserve URLs
const URL_PATTERN = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([^\s]+\.[a-zA-Z]{2,}\/[^\s]*)/g;

// Function to preserve URLs during math conversion
const preserveUrls = (content: string): { processedText: string, urlMap: Map<string, string> } => {
  const urlMap = new Map<string, string>();
  let counter = 0;
  
  // Replace URLs with placeholders
  const processedText = content.replace(URL_PATTERN, (match) => {
    const placeholder = `__URL_PLACEHOLDER_${counter}__`;
    urlMap.set(placeholder, match);
    counter++;
    return placeholder;
  });
  
  return { processedText, urlMap };
};

// Function to restore URLs from placeholders
const restoreUrls = (content: string, urlMap: Map<string, string>): string => {
  let restoredContent = content;
  
  urlMap.forEach((url, placeholder) => {
    restoredContent = restoredContent.replace(new RegExp(placeholder, 'g'), url);
  });
  
  return restoredContent;
};

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
  }
}

// Convert plaintext math to LaTeX with URL preservation
const convertPlainTextToLaTeX = (text: string): string => {
  // Skip conversion if text contains URL placeholder
  if (text.includes('__URL_PLACEHOLDER_')) {
    return text;
  }

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
  // Preserve existing LaTeX expressions to avoid double conversion
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match) => `__PRESERVED_DISPLAY_MATH__${match}__PRESERVED_DISPLAY_MATH__`);
  text = text.replace(/\$([^$\n]+)\$/g, (match) => `__PRESERVED_INLINE_MATH__${match}__PRESERVED_INLINE_MATH__`);

  // Handle GitHub-flavored Markdown math blocks with ```
  text = text.replace(
    /```math\s*([\s\S]*?)\s*```
    (_, math) => `\n$$\n${math.trim()}\n$$\n`
  )

  // Handle inline math with single backticks and dollar signs
  text = text.replace(
    /`\$([^`]+)\$`/g,
    (_, math) => `$${math.trim()}$`
  )

  // Handle multi-line math blocks with triple backticks
  text = text.replace(
    /```\n\$\$([\s\S]*?)\$\$\n```
    (_, math) => `\n$$\n${math.trim()}\n$$\n`
  )

  // After all conversions, restore preserved math
  text = text.replace(/__PRESERVED_DISPLAY_MATH__\$\$([\s\S]*?)\$\$__PRESERVED_DISPLAY_MATH__/g, '$$$1$$');
  text = text.replace(/__PRESERVED_INLINE_MATH__\$([^$\n]+)\$__PRESERVED_INLINE_MATH__/g, '$$$1$');

  return text
}

// Enhanced preprocessing function with URL preservation
const preprocessMath = (content: string): string => {
  if (!content) return ''

  // First preserve URLs
  const { processedText, urlMap } = preserveUrls(content);
  
  // Handle Markdown-style math
  let processedContent = convertMarkdownToLaTeX(processedText)
  
  // Look for potential plaintext math expressions, avoiding URL placeholders
  const plainTextMathRegex = /([^$\\\n])([\d\w]+[\/\^_\*][\d\w]+|sqrt$$[^)]+$$|\b(alpha|beta|gamma|delta|theta|pi|sigma|omega)\b)/g
  processedContent = processedContent.replace(plainTextMathRegex, (match, pre, expr) => {
    // Don't convert if it's already part of a LaTeX expression or contains a URL placeholder
    if (pre.endsWith('\\') || pre.endsWith('$') || expr.includes('__URL_PLACEHOLDER_')) return match
    return `${pre}$$${convertPlainTextToLaTeX(expr)}$$`
  })
  
  // Handle existing LaTeX expressions
  processedContent = processedContent
    // Handle display math
    .replace(/\\$$([\s\S]*?)\\$$/g, (_, equation) => `\n$$${equation.trim()}$$\n`)
    // Handle inline math
    .replace(/\\$$([\s\S]*?)\\$$/g, (_, equation) => `$${equation.trim()}$`)
    // Handle align environments
    .replace(/\\begin{align\*?}/g, '\\begin{aligned}')
    .replace(/\\end{align\*?}/g, '\\end{aligned}')
    // Normalize spacing
    .replace(/([^$])\$\$/g, '$1\n$$')
    .replace(/\$\$([^$])/g, '$$\n$1')
    .replace(/([^$])\$([^$])/g, '$1 $ $2')
  
  // Restore URLs
  return restoreUrls(processedContent, urlMap);
}

// Enhanced math detection that ignores URLs
const containsMath = (content: string): boolean => {
  if (!content) return false
  
  // First preserve URLs
  const { processedText } = preserveUrls(content);
  
  const patterns = [
    /\\$$([\s\S]*?)\\$$/, // Display math
    /\\$$([\s\S]*?)\\$$/, // Inline math
    /\$\$([\s\S]*?)\$\$/, // Display math with $$
    /\$[^$\n]+\$/, // Inline math with single $
    /\\begin\{[^}]+\}/, // Environment blocks
    /```math/, // Markdown math blocks
    /`\$[^`]+\$`/, // Markdown inline math
    /(\d+)\/(\d+)/, // Fractions
    /(\w+)\^(\d+|\{\w+\})/, // Exponents
    /sqrt\([^)]+\)/, // Square roots
    /(\w+)_(\d+|\{\w+\})/, // Subscripts
    /\b(alpha|beta|gamma|delta|theta|pi|sigma|omega)\b/ // Greek letters
  ]
  
  return patterns.some(pattern => pattern.test(processedText))
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
  const hasMath = containsMath(message || '')
  const processedContent = hasMath ? preprocessMath(message || '') : message
  
  const CodeComponent = ({ node, inline, className, children, ...props }: CodeComponentProps) => {
    if (children && Array.isArray(children) && children.length > 0) {
      if (children[0] === '▍') {
        return <span className="mt-1 animate-pulse cursor-default">▍</span>
      }
      
      if (typeof children[0] === 'string') {
        children[0] = children[0].replace('`▍`', '▍')
      }
    }
    
    const match = /language-(\w+)/.exec(className || '')
    
    // Handle math blocks
    if (match && match[1] === 'math') {
      return (
        <div className="math-block">
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
        <span className="inline-math">
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
        language={(match && match[1]) || ''}
        value={String(children).replace(/\n$/, '')}
        {...props}
      />
    )
  }
  
  return (
    <div className={cn('chat-message-text', className)}>
      <MemoizedReactMarkdown
        className="prose break-words dark:prose-invert sm:min-w-70 prose-p:leading-relaxed prose-pre:p-0"
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          [rehypeExternalLinks, { target: '_blank' }]
        ]}
        components={{
          code: CodeComponent
        }}
      >
        {processedContent}
      </MemoizedReactMarkdown>
    </div>
  )
}

// Error boundary component
const LaTeXErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  try {
    return <>{children}</>
  } catch (error) {
    console.error('LaTeX Rendering Error:', error)
    return (
      <span className="text-red-500">
        Failed to render LaTeX expression
      </span>
    )
  }
}
