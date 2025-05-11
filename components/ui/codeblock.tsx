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

export const programmingLanguages: languageMap = { /* ... unchanged ... */ }

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

  // ... downloadAsFile and onCopy functions unchanged ...

  const generateGraph = async () => {
    if (language !== 'python' || !value.includes('plotly')) return;
    
    setIsGenerating(true);
    setGraphError(null);
    setGraphVisible(false);
    
    try {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('sandbox', 'allow-scripts');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const TIMEOUT_MS = 60000;
      const requiredImports = `
        import plotly.graph_objects as go
        import pandas as pd
        import numpy as np
      `;

      const extractFigure = `
        ${requiredImports}
        ${value}

        window.figureFound = null;
        const checkForFigure = () => {
          const vars = Object.keys(window);
          for (const name of vars) {
            try {
              const obj = window[name];
              if (obj?.data && Array.isArray(obj.data)) {
                window.figureFound = obj;
                return true;
              }
            } catch {}
          }
          return false;
        };

        const figureCheckInterval = setInterval(() => {
          if (checkForFigure()) {
            clearInterval(figureCheckInterval);
            window.parent.postMessage({ 
              success: true, 
              figure: window.figureFound 
            }, '*');
          }
        }, 500);

        setTimeout(() => {
          clearInterval(figureCheckInterval);
          if (!window.figureFound) {
            window.parent.postMessage({
              error: 'No Plotly figure found. Ensure you create a figure variable'
            }, '*');
          }
        }, ${TIMEOUT_MS - 5000});
      `;

      const figure = await Promise.race([
        new Promise<PlotlyFigure | null>((resolve, reject) => {
          window.addEventListener('message', (event) => {
            if (event.data?.error) {
              reject(new Error(event.data.error));
            } else if (event.data?.success) {
              resolve(event.data.figure);
            }
          }, { once: true });

          iframe.contentDocument?.write(`
            <html>
              <head>
                <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/pandas/2.0.3/pandas.min.js"></script>
              </head>
              <body>
                <script type="text/python">
                  ${extractFigure}
                </script>
              </body>
            </html>
          `);
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(
            `Timeout: Execution exceeded ${TIMEOUT_MS/1000}s. Check for infinite loops`
          )), TIMEOUT_MS)
        )
      ]);

      iframe.remove();
      
      if (figure?.data) {
        window.Plotly.purge(graphId);
        window.Plotly.newPlot(graphId, figure.data, figure.layout || {});
        setGraphVisible(true);
      }
    } catch (error: any) {
      console.error('Graph error:', error);
      const message = error.message.startsWith('Timeout') ? error.message :
        error.message.includes('import') ? `Missing required import: ${error.message}` :
        error.message.includes('figure') ? `Figure creation error: ${error.message}` :
        `Execution error: ${error.message}`;
      setGraphError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const isPlotlyCode = language === 'python' && value.includes('plotly');

  return (
    <div className="relative w-full font-sans codeblock bg-neutral-800">
      {/* ... rest of the JSX unchanged ... */}
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

export { CodeBlock }
