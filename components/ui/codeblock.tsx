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

interface PlotlyFigure {
  data: any[];
  layout?: Record<string, any>;
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
      
      // Extract the plotly figure more directly
      const extractFigure = `
        // Helper function to find Plotly figures in the global scope
        function findPlotlyFigures() {
          const figures = [];
          for (const key in window) {
            try {
              const obj = window[key];
              if (obj && 
                  typeof obj === 'object' && 
                  Array.isArray(obj.data) &&
                  obj.data.length > 0) {
                figures.push({ name: key, figure: obj });
              }
            } catch (e) {
              // Skip any objects that throw errors when accessed
              continue;
            }
          }
          return figures;
        }

        // Store initial state
        const initialFigures = findPlotlyFigures();
        const initialKeys = Object.keys(window);
        
        // Execute the user code
        try {
          ${value}
          
          // Find new figures that appeared after execution
          const newFigures = findPlotlyFigures().filter(fig => 
            !initialFigures.some(initial => initial.name === fig.name)
          );
          
          // Find new global variables that might be figures
          const newVars = Object.keys(window).filter(key => !initialKeys.includes(key));
          for (const key of newVars) {
            try {
              const obj = window[key];
              if (obj && 
                  typeof obj === 'object' && 
                  Array.isArray(obj.data) &&
                  obj.data.length > 0) {
                newFigures.push({ name: key, figure: obj });
              }
            } catch (e) {
              continue;
            }
          }
          
          // If we found figures, return the last one (most likely the one created last)
          if (newFigures.length > 0) {
            window.parent.postMessage({ 
              success: true, 
              figure: newFigures[newFigures.length - 1].figure 
            }, '*');
          } else {
            // If no new figures were created, look for common figure names
            const commonNames = ['fig', 'figure', 'plt_fig', 'plot_fig', 'plotly_fig'];
            for (const name of commonNames) {
              if (window[name] && typeof window[name] === 'object' && Array.isArray(window[name].data)) {
                window.parent.postMessage({ success: true, figure: window[name] }, '*');
                return;
              }
            }
            window.parent.postMessage({ 
              error: 'No Plotly figure was created by this code' 
            }, '*');
          }
        } catch (e) {
          window.parent.postMessage({ error: e.message }, '*');
        }
      `;
      
      // Create a safe execution environment
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Extended timeout (60 seconds)
      const TIMEOUT_MS = 60000;
      
      // Execute the code in the iframe context with timeout
      const figure = await Promise.race([
        new Promise<PlotlyFigure | null>((resolve, reject) => {
          try {
            // Add null checks for TypeScript
            if (!iframe.contentWindow) {
              throw new Error('Could not access iframe content window');
            }
            
            const iframeDoc = iframe.contentWindow.document;
            
            // Set up message listener
            const handleMessage = (event: MessageEvent) => {
              if (event.data && event.data.error) {
                reject(new Error(event.data.error));
              } else if (event.data && event.data.success && event.data.figure) {
                resolve(event.data.figure);
              }
            };
            
            window.addEventListener('message', handleMessage, { once: true });
            
            // Load Plotly in the iframe
            const plotlyScript = iframeDoc.createElement('script');
            plotlyScript.src = 'https://cdn.plot.ly/plotly-latest.min.js';
            plotlyScript.onload = () => {
              // Once Plotly is loaded, run the extraction code
              const script = iframeDoc.createElement('script');
              script.textContent = extractFigure;
              iframeDoc.body.appendChild(script);
            };
            
            iframeDoc.head.appendChild(plotlyScript);
          } catch (e) {
            reject(e);
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(
            `Graph generation timed out after ${TIMEOUT_MS/1000} seconds. Your code may be too complex or have infinite loops.`
          )), TIMEOUT_MS)
        )
      ]);
      
      // Clean up iframe
      try {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      } catch (e) {
        console.error('Error removing iframe:', e);
      }
      
      // Render the figure
      if (figure && figure.data) {
        window.Plotly.newPlot(graphId, figure.data, figure.layout || {});
        setGraphVisible(true);
      } else {
        throw new Error('Failed to extract Plotly graph from the code');
      }
    } catch (error: unknown) {
      console.error('Graph generation error:', error);
      let errorMessage = 'Failed to generate the graph';
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      setGraphError(errorMessage);
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
          {isGenerating && (
            <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-md flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating graph... This may take a few seconds
            </div>
          )}
          
          {graphError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
              <div className="font-bold mb-1">Error generating graph:</div>
              <div className="font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap">{graphError}</div>
              <div className="mt-2 text-xs">
                Tips:
                <ul className="list-disc pl-5 mt-1">
                  <li>Ensure your code creates a Plotly figure (named &apos;fig&apos;, &apos;figure&apos;, etc.)</li>
                  <li>Check for syntax errors in your Python code</li>
                  <li>Make sure imports and data are properly defined</li>
                </ul>
              </div>
            </div>
          )}
          
          {graphVisible && (
            <div className="border border-gray-200 rounded-md bg-white">
              <div 
                id={graphId} 
                className="w-full h-96 p-4"
              ></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

export { CodeBlock }
