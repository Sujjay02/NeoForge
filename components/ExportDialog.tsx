import React, { useState } from 'react';
import { X, Download, ExternalLink, Loader2, FileCode, Package, Box, Check, AlertCircle, Github } from 'lucide-react';
import { exportAsHTML, exportAsReact, createCodeSandboxLink } from '../utils/exportUtils';
import { GitHubExportDialog } from './GitHubExportDialog';

interface ExportDialogProps {
  code: string;
  explanation: string;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ code, explanation, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showGitHubDialog, setShowGitHubDialog] = useState(false);

  const handleExportHTML = () => {
    try {
      exportAsHTML(code, explanation);
      setSuccess('HTML file downloaded!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError('Failed to export HTML');
    }
  };

  const handleExportReact = () => {
    try {
      exportAsReact(code, explanation);
      setSuccess('React component downloaded!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError('Failed to export React component');
    }
  };

  const handleCodeSandbox = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await createCodeSandboxLink(code);
      window.open(url, '_blank');
      setSuccess('CodeSandbox opened!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError('Failed to create CodeSandbox. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Export Options</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Download HTML */}
          <button
            onClick={handleExportHTML}
            className="w-full flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-zinc-900 dark:text-white">Download HTML</div>
              <div className="text-sm text-zinc-500">Single file, ready to use</div>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
          </button>

          {/* React Component */}
          <button
            onClick={handleExportReact}
            className="w-full flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
          >
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50 transition-colors">
              <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-zinc-900 dark:text-white">React Component</div>
              <div className="text-sm text-zinc-500">Extracted JSX component (.tsx)</div>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
          </button>

          {/* CodeSandbox */}
          <button
            onClick={handleCodeSandbox}
            disabled={loading}
            className="w-full flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors">
              <Box className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-zinc-900 dark:text-white">Open in CodeSandbox</div>
              <div className="text-sm text-zinc-500">Live playground environment</div>
            </div>
            {loading ? (
              <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
            )}
          </button>

          {/* GitHub */}
          <button
            onClick={() => setShowGitHubDialog(true)}
            className="w-full flex items-center space-x-3 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
          >
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
              <Github className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-zinc-900 dark:text-white">Push to GitHub</div>
              <div className="text-sm text-zinc-500">Create repo or update existing</div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
          </button>
        </div>

        <p className="mt-4 text-xs text-zinc-500 text-center">
          Files are generated from your current code
        </p>
      </div>

      {/* GitHub Export Dialog */}
      {showGitHubDialog && (
        <GitHubExportDialog
          code={code}
          explanation={explanation}
          onClose={() => setShowGitHubDialog(false)}
        />
      )}
    </div>
  );
};
