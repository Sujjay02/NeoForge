import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Link2, Twitter, AlertTriangle } from 'lucide-react';
import { encodeShareUrl, getEstimatedUrlLength } from '../utils/urlUtils';

interface ShareDialogProps {
  code: string;
  explanation: string;
  onClose: () => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ code, explanation, onClose }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => encodeShareUrl(code, explanation), [code, explanation]);
  const urlLength = useMemo(() => getEstimatedUrlLength(code, explanation), [code, explanation]);
  const isUrlTooLong = urlLength > 2000;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const shareOnTwitter = () => {
    const text = `Check out this UI I built with NeoForge: ${explanation}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Share Your Creation</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Share URL */}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center space-x-2">
              <Link2 className="w-4 h-4" />
              <span>Share Link</span>
            </label>
            <div className="mt-2 flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 truncate border border-zinc-200 dark:border-zinc-700 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`p-2.5 rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                }`}
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* URL Length Warning */}
            {isUrlTooLong && (
              <div className="mt-2 flex items-start space-x-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  This URL is quite long ({Math.round(urlLength / 1000)}KB). It may not work in all browsers or when shared on some platforms. Consider using a URL shortener.
                </p>
              </div>
            )}
          </div>

          {/* Social Share */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Share on Social
            </label>
            <div className="mt-2 flex space-x-2">
              <button
                onClick={shareOnTwitter}
                className="flex items-center space-x-2 px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors"
              >
                <Twitter className="w-4 h-4" />
                <span>Twitter</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">
              Anyone with this link can view and fork your creation. The entire code is embedded in the URL - no account required!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
