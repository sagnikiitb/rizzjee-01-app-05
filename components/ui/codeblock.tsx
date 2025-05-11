'use client'

import { FC, memo, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { Button } from '@/components/ui/button'
import { generateId } from 'ai'
import { Check, Copy, Download, PlayCircle } from 'lucide-react'

interface Props {
  language: string
  value: string
}

interface languageMap {
  [key: string]: string | undefined
}

export const programmingLanguages: languageMap = {
  javascript: '.js',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  'c#': '.cs',
  ruby: '.rb',
  php: '.php',
  swift: '.swift',
  'objective-c': '.m',
  kotlin: '.kt',
  typescript: '.ts',
  go: '.go',
  perl: '.pl',
  rust: '.rs',
  scala: '.scala',
  haskell: '.hs',
  lua: '.lua',
  shell: '.sh',
  sql: '.sql',
  html: '.html',
  css: '.css'
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
}

declare global {
  interface Window {
    Plotly: any;
  }
}

const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const [graphVisible, setGraphVisible] = useState(false)
  const [graphId] = useState(`graph-${generateId()}`)
  const [isGenerating, setIsGenerating] = useState(false)
  const [graphError, setGraphError] = useState<string | null>(null)

  const downloadAsFile = () => {
    if (typeof window === 'undefined') {
      return
    }
    const fileExtension = programmingLanguages[language] || '.file'
    const suggestedFileName = `file-${generateId()}${fileExtension}`
    const fileName = window.prompt('Enter file name', suggestedFileName)

    if (!fileName) {
      // User pressed cancel on prompt.
      return
    }

    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(value)
  }

  const generateGraph = async () => {
    if (language !== 'python' || !value.includes('plotly')) return;
    
    setIsGenerating(true);
    setGraphError(null);
    
    try {
      // Load Plotly if it's not already loaded
      if (!window.Plotly) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      // Create a function from the code and execute it
      // First, we need to extract any figure variable
      const modifiedCode = `
        ${value}
        
        // Return the last figure object if it exists
        (() => {
          try {
            // Common patterns for plotly figures
            const possibleFigNames = ['fig', 'figure', 'plt', 'plot'];
            for (const name of possibleFigNames) {
              if (typeof window[name] !== 'undefined' && window[name].data) {
                return window[name];
              }
            }
            // If no figure found in globals, look for the last plotly figure in the code
            const vars = Object.keys(window).filter(key => 
              typeof window[key] === 'object' && 
              window[key] !== null && 
              window[key].data && 
              Array.isArray(window[key].data)
            );
            if (vars.length > 0) {
              return window[vars[vars.length - 1]];
            }
            throw new Error('No Plotly figure found in the code');
          } catch (e) {
            throw e;
          }
        })();
      `;
      
      // Create a safe execution environment
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Execute the code in the iframe context
      const figure = await new Promise((resolve, reject) => {
        try {
          const iframeDoc = iframe.contentWindow.document;
          const script = iframeDoc.createElement('script');
          script.textContent = `
            try {
              ${modifiedCode}
            } catch (e) {
              parent.postMessage({ error: e.message }, '*');
            }
          `;
          
          const handleMessage = (event) => {
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else if (event.data.figure) {
              resolve(event.data.figure);
            }
          };
          
          window.addEventListener('message', handleMessage, { once: true });
          iframeDoc.body.appendChild(script);
          
          // Timeout for execution
          setTimeout(() => reject(new Error('Graph generation timed out')), 5000);
        } catch (e) {
          reject(e);
        }
      });
      
      // Cleanup iframe
      document.body.removeChild(iframe);
      
      // Render the figure
      if (figure) {
        window.Plotly.newPlot(graphId, figure.data, figure.layout);
        setGraphVisible(true);
      } else {
        throw new Error('Failed to generate Plotly graph');
      }
    } catch (error) {
      console.error('Graph generation error:', error);
      setGraphError(error.message || 'Failed to generate the graph');
    } finally {
      setIsGenerating(false);
    }
  };

  const isPlotlyCode = language === 'python' && value.includes('plotly');

  return (
    <div className="relative w-full font-sans codeblock bg-neutral-800">
      <div className="flex items-center justify-between w-full px-6 py-1 pr-4 bg-neutral-700 text-zinc-100">
        <span className="text-xs lowercase">{language}</span>
        <div className="flex items-center space-x-1">
          {isPlotlyCode && (
            <Button
              variant="ghost"
              className="focus-visible:ring-1"
              onClick={generateGraph}
              size="sm"
              disabled={isGenerating}
            >
              <PlayCircle className="w-4 h-4 mr-1" />
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          )}
          <Button
            variant="ghost"
            className="focus-visible:ring-1"
            onClick={downloadAsFile}
            size="icon"
          >
            <Download className="w-4 h-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-xs focus-visible:ring-1 focus-visible:ring-offset-0"
            onClick={onCopy}
          >
            {isCopied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={coldarkDark}
        PreTag="div"
        showLineNumbers
        customStyle={{
          margin: 0,
          width: '100%',
          background: 'transparent',
          padding: '1.5rem 1rem'
        }}
        lineNumberStyle={{
          userSelect: 'none'
        }}
        codeTagProps={{
          style: {
            fontSize: '0.9rem',
            fontFamily: 'var(--font-mono)'
          }
        }}
      >
        {value}
      </SyntaxHighlighter>
      
      {/* Graph output area */}
      {isPlotlyCode && (
        <div className="mt-4">
          {graphError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
              {graphError}
            </div>
          )}
          
          {graphVisible && (
            <div 
              id={graphId} 
              className="w-full h-96 border border-gray-200 rounded-md bg-white p-4"
            ></div>
          )}
        </div>
      )}
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

export { CodeBlock }
