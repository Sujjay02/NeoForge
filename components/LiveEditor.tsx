import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { CodePreview } from './CodePreview';
import { Eye, Code2, Columns, Play, RotateCcw, Loader2 } from 'lucide-react';
import { Viewport } from '../types';

interface LiveEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  language?: 'html' | 'python' | 'javascript' | 'typescript';
  viewport?: Viewport;
}

type SplitMode = 'editor' | 'preview' | 'split';

export const LiveEditor: React.FC<LiveEditorProps> = ({
  code,
  onCodeChange,
  language = 'html',
  viewport = 'full',
}) => {
  const [localCode, setLocalCode] = useState(code);
  const [previewCode, setPreviewCode] = useState(code);
  const [splitMode, setSplitMode] = useState<SplitMode>('split');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setLocalCode(code);
    setPreviewCode(code);
    setHasChanges(false);
  }, [code]);

  // Debounced preview update
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setTimeout(() => {
      setPreviewCode(localCode);
      setHasChanges(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [localCode, autoRefresh]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const newCode = value || '';
      setLocalCode(newCode);
      onCodeChange(newCode);
      setHasChanges(newCode !== previewCode);
    },
    [onCodeChange, previewCode]
  );

  const handleManualRefresh = () => {
    setPreviewCode(localCode);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalCode(code);
    setPreviewCode(code);
    onCodeChange(code);
    setHasChanges(false);
  };

  // Map language to Monaco language
  const monacoLanguage = language === 'python' ? 'python' : 'html';

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setSplitMode('editor')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${
              splitMode === 'editor'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
            title="Editor only"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Editor</span>
          </button>
          <button
            onClick={() => setSplitMode('split')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${
              splitMode === 'split'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
            title="Split view"
          >
            <Columns className="w-4 h-4" />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            onClick={() => setSplitMode('preview')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${
              splitMode === 'preview'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
            title="Preview only"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="hidden sm:inline">Auto-refresh</span>
          </label>

          {hasChanges && !autoRefresh && (
            <button
              onClick={handleManualRefresh}
              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors"
            >
              <Play className="w-3 h-3" />
              <span>Run</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
            title="Reset to original"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="flex-1 flex overflow-hidden">
        {(splitMode === 'editor' || splitMode === 'split') && (
          <div
            className={`${splitMode === 'split' ? 'w-1/2' : 'w-full'} h-full ${
              splitMode === 'split' ? 'border-r border-zinc-700' : ''
            }`}
          >
            <Editor
              height="100%"
              language={monacoLanguage}
              value={localCode}
              onChange={handleEditorChange}
              theme="vs-dark"
              loading={
                <div className="flex items-center justify-center h-full text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading editor...
                </div>
              }
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                insertSpaces: true,
                folding: true,
                lineDecorationsWidth: 10,
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
              }}
            />
          </div>
        )}
        {(splitMode === 'preview' || splitMode === 'split') && (
          <div className={`${splitMode === 'split' ? 'w-1/2' : 'w-full'} h-full bg-white`}>
            {monacoLanguage === 'html' ? (
              <CodePreview html={previewCode} viewport={viewport} />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 bg-zinc-100 dark:bg-zinc-800">
                <p>Python preview not available in editor mode</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
