import React, { useState, useEffect, useRef } from 'react';
import { CodePreviewProps, Viewport } from '../types';
import { ErrorOverlay } from './ErrorOverlay';

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1024px',
  full: '100%',
};

interface ExtendedCodePreviewProps extends CodePreviewProps {
  viewport?: Viewport;
}

export const CodePreview: React.FC<ExtendedCodePreviewProps> = ({ html, viewport = 'full' }) => {
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeKey = useRef(0);

  // Inject error handler script into HTML
  const htmlWithErrorHandler = html.replace(
    '</head>',
    `<script>
      window.onerror = function(msg, url, line, col, error) {
        window.parent.postMessage({
          type: 'NEOFORGE_IFRAME_ERROR',
          error: msg + (line ? ' (line ' + line + ')' : '')
        }, '*');
        return true;
      };
      window.addEventListener('unhandledrejection', function(e) {
        window.parent.postMessage({
          type: 'NEOFORGE_IFRAME_ERROR',
          error: 'Unhandled Promise Rejection: ' + (e.reason?.message || e.reason || 'Unknown error')
        }, '*');
      });
    </script></head>`
  );

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'NEOFORGE_IFRAME_ERROR') {
        setRuntimeError(e.data.error);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Clear error on new HTML
  useEffect(() => {
    setRuntimeError(null);
  }, [html]);

  const handleRetry = () => {
    setRuntimeError(null);
    iframeKey.current += 1;
  };

  const handleCopyError = () => {
    if (runtimeError) {
      navigator.clipboard.writeText(runtimeError);
    }
  };

  const width = VIEWPORT_WIDTHS[viewport];
  const isFullWidth = viewport === 'full';

  return (
    <div className={`w-full h-full ${isFullWidth ? '' : 'flex items-start justify-center bg-zinc-100 dark:bg-zinc-900/50 overflow-auto p-4'}`}>
      <div
        className={`${isFullWidth ? 'w-full h-full' : 'bg-white dark:bg-zinc-900 shadow-xl rounded-lg overflow-hidden transition-all duration-300'}`}
        style={{
          width: isFullWidth ? '100%' : width,
          height: isFullWidth ? '100%' : 'calc(100% - 2rem)',
          maxWidth: '100%',
        }}
      >
        <div className="relative w-full h-full">
          <iframe
            key={iframeKey.current}
            ref={iframeRef}
            title="UI Preview"
            srcDoc={htmlWithErrorHandler}
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin"
          />
          {runtimeError && (
            <ErrorOverlay
              error={runtimeError}
              onRetry={handleRetry}
              onCopyError={handleCopyError}
              onDismiss={() => setRuntimeError(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
