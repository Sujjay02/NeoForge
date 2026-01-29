import React from 'react';
import { CodePreviewProps } from '../types';

export const CodePreview: React.FC<CodePreviewProps> = ({ html }) => {
  return (
    <iframe
      title="UI Preview"
      srcDoc={html}
      className="w-full h-full border-none bg-white"
      sandbox="allow-scripts allow-same-origin"
    />
  );
};