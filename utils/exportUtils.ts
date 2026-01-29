/**
 * Export utilities for downloading and sharing generated code
 */

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50);
}

/**
 * Export as HTML file
 */
export function exportAsHTML(code: string, explanation: string): void {
  const filename = sanitizeFilename(explanation || 'component') + '.html';
  const blob = new Blob([code], { type: 'text/html' });
  downloadBlob(blob, filename);
}

/**
 * Extract component code from HTML
 */
function extractComponentFromHTML(html: string): string {
  // Try to extract Babel JSX script content
  const babelMatch = html.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/);
  if (babelMatch) {
    return babelMatch[1].trim();
  }

  // Try to extract regular script content
  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    return scriptMatch[1].trim();
  }

  return html;
}

/**
 * Wrap extracted code as a React component file
 */
function wrapAsReactComponent(code: string): string {
  // Check if code already has imports
  const hasReactImport = code.includes("import React") || code.includes("from 'react'");

  const imports = hasReactImport
    ? ''
    : `import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
`;

  return `${imports}${code}

export default App;
`;
}

/**
 * Export as React component (.tsx)
 */
export function exportAsReact(code: string, explanation: string): void {
  const name = sanitizeFilename(explanation || 'component');
  const componentCode = extractComponentFromHTML(code);
  const reactCode = wrapAsReactComponent(componentCode);

  const blob = new Blob([reactCode], { type: 'text/typescript' });
  downloadBlob(blob, `${name}.tsx`);
}

/**
 * Create CodeSandbox link
 */
export async function createCodeSandboxLink(code: string): Promise<string> {
  const files: Record<string, { content: string }> = {
    'index.html': { content: code },
    'package.json': {
      content: JSON.stringify(
        {
          name: 'neoforge-export',
          version: '1.0.0',
          main: 'index.html',
          dependencies: {},
        },
        null,
        2
      ),
    },
  };

  // Use CodeSandbox define API
  const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ files }),
  });

  if (!response.ok) {
    throw new Error('Failed to create CodeSandbox');
  }

  const data = await response.json();
  return `https://codesandbox.io/s/${data.sandbox_id}`;
}

/**
 * Generate a data URL for the code (for quick sharing)
 */
export function generateDataUrl(code: string): string {
  const base64 = btoa(unescape(encodeURIComponent(code)));
  return `data:text/html;base64,${base64}`;
}
