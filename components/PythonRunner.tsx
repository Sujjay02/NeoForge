import React, { useEffect, useState, useRef } from 'react';
import { Play, RotateCcw, Terminal, AlertCircle, Loader2, Download, Copy, Check, X } from 'lucide-react';

interface PythonRunnerProps {
  code: string;
}

declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}

export const PythonRunner: React.FC<PythonRunnerProps> = ({ code }) => {
  const [output, setOutput] = useState<Array<{ type: 'out' | 'err'; content: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(true);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Download state
  const [isNaming, setIsNaming] = useState(false);
  const [fileName, setFileName] = useState('script.py');
  
  const pyodideRef = useRef<any>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const plotRootRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of terminal on output
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  // Load Pyodide and Packages
  useEffect(() => {
    const loadEngine = async () => {
      try {
        if (!window.loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.async = true;
          document.body.appendChild(script);
          
          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        if (!pyodideRef.current) {
          const pyodide = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
          });
          
          await pyodide.loadPackage(["numpy", "matplotlib"]);
          pyodideRef.current = pyodide;
        }
        
        setPyodideReady(true);
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
        setOutput(prev => [...prev, { type: 'err', content: 'Failed to load Python engine. Check console.' }]);
      } finally {
        setIsLoadingPyodide(false);
      }
    };

    loadEngine();
  }, []);

  const runCode = async () => {
    if (!pyodideRef.current || isRunning) return;

    // Safety check: Don't try to run HTML
    const trimmedCode = code.trim();
    if (trimmedCode.startsWith('<!DOCTYPE') || trimmedCode.startsWith('<html') || trimmedCode.startsWith('<div')) {
      setOutput(prev => [
        ...prev, 
        { type: 'err', content: 'SyntaxError: The generated code appears to be HTML, not Python.' },
        { type: 'err', content: 'Hint: Try asking explicitly for "Python code" or "Python script" to regenerate.' }
      ]);
      return;
    }

    setIsRunning(true);
    setOutput([]); // Clear previous output
    
    // Clear Plot Root
    if (plotRootRef.current) {
        plotRootRef.current.innerHTML = '';
    }

    try {
      const pyodide = pyodideRef.current;
      
      // Reset stdout capture
      pyodide.setStdout({
        batched: (text: string) => {
          setOutput(prev => [...prev, { type: 'out', content: text }]);
        }
      });

      // Reset stderr capture
      pyodide.setStderr({
        batched: (text: string) => {
          setOutput(prev => [...prev, { type: 'err', content: text }]);
        }
      });

      // Execute
      await pyodide.runPythonAsync(code);
      
    } catch (err: any) {
      setOutput(prev => [...prev, { type: 'err', content: err.toString() }]);
    } finally {
      setIsRunning(false);
    }
  };

  const performDownload = () => {
    let name = fileName.trim();
    if (!name) name = 'script.py';
    if (!name.endsWith('.py')) name += '.py';

    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsNaming(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-zinc-300 font-mono text-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="font-medium text-zinc-300">Python Console</span>
          {isLoadingPyodide && (
            <span className="flex items-center text-xs text-zinc-500 ml-2">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              Loading Engine...
            </span>
          )}
          {pyodideReady && !isLoadingPyodide && (
            <span className="text-xs text-green-500 ml-2 flex items-center">
              ● Ready (NumPy + Matplotlib)
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
           {isNaming ? (
            <div className="flex items-center bg-[#333] rounded-md px-1 mr-1 animate-in fade-in zoom-in duration-200">
               <input 
                  type="text" 
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="bg-transparent border-none text-zinc-200 text-xs px-2 py-1.5 w-32 focus:outline-none font-mono placeholder-zinc-500"
                  autoFocus
                  placeholder="filename.py"
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') performDownload();
                      if (e.key === 'Escape') setIsNaming(false);
                  }}
               />
               <button 
                onClick={performDownload} 
                className="p-1 hover:bg-[#444] rounded text-zinc-400 hover:text-green-400 transition-colors"
                title="Save"
               >
                 <Check className="w-3 h-3" />
               </button>
               <button 
                onClick={() => setIsNaming(false)} 
                className="p-1 hover:bg-[#444] rounded text-zinc-400 hover:text-red-400 transition-colors"
                title="Cancel"
               >
                 <X className="w-3 h-3" />
               </button>
            </div>
           ) : (
            <>
              <button 
                onClick={handleCopy}
                className="p-1.5 hover:bg-[#333] rounded-md transition-colors text-zinc-400 hover:text-white flex items-center gap-2"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsNaming(true)}
                className="p-1.5 hover:bg-[#333] rounded-md transition-colors text-zinc-400 hover:text-white"
                title="Download .py (VS Code / GitHub)"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
           )}
           
           <div className="w-px h-4 bg-[#444] mx-1"></div>
           
           <button 
            onClick={() => setOutput([])}
            className="p-1.5 hover:bg-[#333] rounded-md transition-colors text-zinc-400 hover:text-white"
            title="Clear Output"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={runCode}
            disabled={!pyodideReady || isRunning}
            className={`flex items-center space-x-2 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white transition-all ${
              (!pyodideReady || isRunning) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Run</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Output/Visualization Area */}
        <div className="flex-[3] bg-[#2d2d2d] border-b border-[#333] resize-y overflow-auto relative min-h-[200px]">
           <div 
             id="plot-root" 
             ref={plotRootRef}
             className="w-full h-full flex flex-col items-center justify-center p-4"
           ></div>
           
           {/* Placeholder text if empty */}
           {!isRunning && (!plotRootRef.current || plotRootRef.current.childElementCount === 0) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="text-center">
                    <div className="text-4xl font-bold text-zinc-500 mb-2">Visual Output</div>
                    <div className="text-sm text-zinc-600">Graphics, plots, and UI controls appear here</div>
                </div>
              </div>
           )}
        </div>

        {/* Terminal Text Output */}
        <div className="flex-1 p-4 overflow-y-auto font-mono bg-[#1e1e1e]">
            {output.length === 0 && !isRunning && (
                <div className="text-zinc-600 italic mt-2">
                    Console output...
                </div>
            )}
            
            {output.map((line, idx) => (
                <div key={idx} className={`whitespace-pre-wrap mb-1 ${
                    line.type === 'err' ? 'text-red-400' : 'text-zinc-100'
                }`}>
                    {line.content}
                </div>
            ))}
            <div ref={outputEndRef} />
        </div>
      </div>
    </div>
  );
};