'use client';
import { FC, memo, useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { generateId } from 'ai';
import { Check, Copy, Download, PlayCircle } from 'lucide-react';

interface Props {
language: string;
value: string;
}

interface LanguageMap {
[key: string]: string | undefined;
}

export const programmingLanguages: LanguageMap = {
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
};

declare global {
interface Window {
Plotly: any;
pyodide: any;
loadPyodide: any;
}
}

interface PlotlyFigure {
data: any[];
layout?: Record<string, any>;
}

const CodeBlock: FC<Props> = memo(({ language, value }) => {
const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
const [graphVisible, setGraphVisible] = useState(false);
const [graphId] = useState(`graph-${generateId()}`);
const [isGenerating, setIsGenerating] = useState(false);
const [graphError, setGraphError] = useState<string | null>(null);
const [pyodideLoaded, setPyodideLoaded] = useState(false);
const [pyodideLoading, setPyodideLoading] = useState(false);
const [logs, setLogs] = useState<string[]>([]);

// ----------------------------------------------------------------------------
// Function to add a log entry with timestamp.
// ----------------------------------------------------------------------------
const addLog = (message: string) => {
const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
setLogs((prev) => [...prev, [${timestamp}] ${message}]);
console.log([Pyodide] ${message});
};

// ----------------------------------------------------------------------------
// Function to programmatically load Pyodide if not loaded.
// ----------------------------------------------------------------------------
const loadPyodideEnv = async () => {
if (pyodideLoaded || pyodideLoading) return;
setPyodideLoading(true);
addLog('Loading Pyodide...');

try {
  // Load Pyodide script
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  addLog('Pyodide script loaded, initializing...');

  // Initialize Pyodide
  const pyodide = await window.loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
  });
  window.pyodide = pyodide;

  // Load packages
  addLog('Installing required packages...');
  await pyodide.loadPackagesFromImports(`

import numpy
`);
addLog('Installing micropip...');
await pyodide.loadPackage('micropip');
const micropip = pyodide.pyimport('micropip');
addLog('Installing plotly...');
await micropip.install('plotly');

  addLog('Pyodide setup complete!');
  setPyodideLoaded(true);
} catch (error: any) {
  addLog(`Pyodide loading error: ${error.message}`);
  setGraphError(`Failed to load Python environment: ${error.message}`);
} finally {
  setPyodideLoading(false);
}

};

// ----------------------------------------------------------------------------
// Function to programmatically load Plotly for rendering in the browser.
// ----------------------------------------------------------------------------
const loadPlotlyScript = async () => {
if (window.Plotly) {
// Already loaded
return;
}
addLog('Loading Plotly JS from CDN...');
try {
const script = document.createElement('script');
script.src = 'https://cdn.plot.ly/plotly-3.0.1.min.js';
await new Promise((resolve, reject) => {
script.onload = resolve;
script.onerror = reject;
document.head.appendChild(script);
});
addLog('Plotly script loaded successfully');
} catch (error: any) {
addLog(Plotly loading error: ${error.message});
setGraphError(Failed to load Plotly script: ${error.message});
}
};

// ----------------------------------------------------------------------------
// Function to download code as a file.
// ----------------------------------------------------------------------------
const downloadAsFile = () => {
if (typeof window === 'undefined') {
return;
}
const fileExtension = programmingLanguages[language] || '.file';
const suggestedFileName = file-${generateId()}${fileExtension};
const fileName = window.prompt('Enter file name', suggestedFileName);
if (!fileName) {
// User pressed cancel
return;
}
const blob = new Blob([value], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.download = fileName;
link.href = url;
link.style.display = 'none';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
};

// ----------------------------------------------------------------------------
// Function to copy code to clipboard.
// ----------------------------------------------------------------------------
const onCopy = () => {
if (isCopied) return;
copyToClipboard(value);
};

// ----------------------------------------------------------------------------
// Main function to generate the Plotly graph via Pyodide.
// ----------------------------------------------------------------------------
const generateGraph = async () => {
if (language !== 'python' || !value.includes('plotly')) return;
setIsGenerating(true);
setGraphError(null);
setGraphVisible(false);
setLogs([]);

try {
  // Ensure Pyodide is loaded
  await loadPyodideEnv();
  if (!pyodideLoaded) {
    throw new Error('Failed to load Python environment');
  }

  // Ensure Plotly is available in the browser
  await loadPlotlyScript();
  if (!window.Plotly) {
    throw new Error('Plotly not available in browser environment');
  }

  const pyodide = window.pyodide;

  // Code snippet to execute user’s code + extract the first Plotly figure
  // Comments fixed here:
  const extractorCode = `

import sys
import io
import traceback
from js import console
Capture stdout and stderr

stdout_capture = io.StringIO()
stderr_capture = io.StringIO()

sys.stdout = stdout_capture
sys.stderr = stderr_capture

try:
import numpy as np
import plotly.graph_objects as go
from plotly.utils import PlotlyJSONEncoder
import json

def find_figures():
    figures = []
    for name, obj in globals().items():
        if hasattr(obj, 'to_json') and callable(obj.to_json):
            figures.append((name, obj))
    return figures

USER_CODE = '''${value.replace(/'/g, "\\'")}'''
print("Executing Python code:")
print("---------------------")
print(USER_CODE)
print("---------------------")

# Execute user code
exec(USER_CODE, globals())

# Find all figures
figures = find_figures()
if figures:
    fig_name, fig = figures[0]
    fig_json = json.dumps(fig.to_dict(), cls=PlotlyJSONEncoder)
    print(f"Found figure: {fig_name}")
    result = {
        "success": True,
        "figure": fig_json,
        "stdout": stdout_capture.getvalue(),
        "stderr": stderr_capture.getvalue()
    }
else:
    result = {
        "success": False,
        "error": "No Plotly figure found in the global namespace",
        "stdout": stdout_capture.getvalue(),
        "stderr": stderr_capture.getvalue()
    }

except Exception as e:
traceback_str = traceback.format_exc()
result = {
"success": False,
"error": str(e),
"traceback": traceback_str,
"stdout": stdout_capture.getvalue(),
"stderr": stderr_capture.getvalue()
}
Reset stdout and stderr

sys.stdout = sys.stdout
sys.stderr = sys.stderr

result
`;

  addLog('Executing Python code...');

  const TIMEOUT_MS = 30000;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () =>
        reject(
          new Error(
            `Timeout: Execution exceeded ${TIMEOUT_MS / 1000}s. Check for infinite loops`
          )
        ),
      TIMEOUT_MS
    );
  });

  const executionPromise = (async () => {
    try {
      const rawResult = await pyodide.runPythonAsync(extractorCode);
      return pyodide.toPy(rawResult).toJs();
    } catch (error: any) {
      throw new Error(`Python execution error: ${error.message}`);
    }
  })();

  const result: any = await Promise.race([executionPromise, timeoutPromise]);

  // Log stdout/stderr
  if (result.stdout) {
    addLog(`Python stdout: ${result.stdout}`);
  }
  if (result.stderr) {
    addLog(`Python stderr: ${result.stderr}`);
  }

  if (!result.success) {
    addLog(`Execution failed: ${result.error}`);
    if (result.traceback) {
      addLog(`Traceback: ${result.traceback}`);
    }
    throw new Error(result.error);
  }

  // Parse and render
  addLog('Parsing plot data...');
  const figureData = JSON.parse(result.figure);
  addLog('Rendering plot...');
  window.Plotly.purge(graphId);
  window.Plotly.newPlot(graphId, figureData.data, figureData.layout || {});
  addLog('Plot rendered successfully!');
  setGraphVisible(true);
} catch (error: any) {
  console.error('Graph error:', error);
  addLog(`Error: ${error.message}`);
  const message = error.message.startsWith('Timeout')
    ? error.message
    : error.message.includes('import')
    ? `Missing required import: ${error.message}`
    : error.message.includes('figure')
    ? `Figure creation error: ${error.message}`
    : `Execution error: ${error.message}`;
  setGraphError(message);
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
disabled={isGenerating || pyodideLoading}
>
<PlayCircle className="w-4 h-4 mr-1" />
{isGenerating
? 'Generating...'
: pyodideLoading
? 'Loading...'
: 'Generate'}
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
{isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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

  {isPlotlyCode && (
    <div className="mt-4">
      {(isGenerating || pyodideLoading) && (
        <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-md flex items-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 

3.042 1.135 5.824 3 7.938l3-2.647z"
/>
</svg>
{pyodideLoading ? 'Loading Python environment...' : 'Generating graph...'} This may take a few seconds
</div>
)}

      {graphError && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
          <div className="font-bold mb-1">Error generating graph:</div>
          <div className="font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap">
            {graphError}
          </div>
          <div className="mt-2 text-xs">
            Tips:
            <ul className="list-disc pl-5 mt-1">
              <li>Ensure your code creates a Plotly figure (named fig, figure, etc.)</li>
              <li>Check for syntax errors in your Python code</li>
              <li>Make sure imports and data are properly defined</li>
            </ul>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mb-4 border border-gray-300 rounded-md">
          <div className="bg-gray-100 px-4 py-2 font-mono text-sm font-bold border-b border-gray-300 flex justify-between items-center">
            <span>Execution Logs</span>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <pre className="p-4 text-xs font-mono bg-black text-green-400 overflow-auto max-h-60 whitespace-pre-wrap">
            {logs.join('\n')}
          </pre>
        </div>
      )}

      {graphVisible && (
        <div className="border border-gray-200 rounded-md bg-white">
          <div id={graphId} className="w-full h-96 p-4"></div>
        </div>
      )}
    </div>
  )}
</div>

);
});

CodeBlock.displayName = 'CodeBlock';
export { CodeBlock };
