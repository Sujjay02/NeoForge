import React from 'react';
import { AlertTriangle, RefreshCcw, Copy, Bug } from 'lucide-react';

interface ErrorOverlayProps {
  error: string;
  onRetry: () => void;
  onCopyError: () => void;
  onDismiss: () => void;
}

interface ParsedError {
  category: string;
  lineNumber: number | null;
  message: string;
}

function parseError(err: string): ParsedError {
  // Extract line numbers from common error formats
  const lineMatch = err.match(/line (\d+)/i) || err.match(/:(\d+):/) || err.match(/at line (\d+)/);
  const lineNumber = lineMatch ? parseInt(lineMatch[1]) : null;

  // Categorize error type
  let category = 'Runtime Error';
  if (err.includes('SyntaxError')) category = 'Syntax Error';
  else if (err.includes('ReferenceError')) category = 'Reference Error';
  else if (err.includes('TypeError')) category = 'Type Error';
  else if (err.includes('RangeError')) category = 'Range Error';
  else if (err.includes('NetworkError') || err.includes('fetch')) category = 'Network Error';

  return { category, lineNumber, message: err };
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
  error,
  onRetry,
  onCopyError,
  onDismiss,
}) => {
  const { category, lineNumber, message } = parseError(error);

  return (
    <div
      className="absolute inset-0 bg-red-950/90 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onDismiss}
    >
      <div
        className="bg-zinc-900 border border-red-500/50 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-red-500/20 rounded-full flex-shrink-0">
            <Bug className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-red-400">{category}</h3>
              {lineNumber && (
                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                  Line {lineNumber}
                </span>
              )}
            </div>
            <pre className="mt-3 p-3 bg-zinc-800 rounded-lg text-sm text-zinc-300 overflow-auto max-h-40 font-mono whitespace-pre-wrap break-words">
              {message}
            </pre>
            <p className="mt-3 text-sm text-zinc-500">
              Click "Retry" to reload the preview, or copy the error to fix it.
            </p>
          </div>
        </div>
        <div className="flex space-x-2 mt-4">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center space-x-2 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <button
            onClick={onCopyError}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-200 text-sm transition-colors"
            title="Copy error message"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
