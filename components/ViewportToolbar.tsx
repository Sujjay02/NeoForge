import React from 'react';
import { Smartphone, Tablet, Monitor, Maximize2 } from 'lucide-react';
import { Viewport } from '../types';

interface ViewportToolbarProps {
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
}

const VIEWPORT_OPTIONS: Array<{
  id: Viewport;
  label: string;
  icon: React.ReactNode;
  width: string;
}> = [
  { id: 'mobile', label: 'Mobile', icon: <Smartphone className="w-4 h-4" />, width: '375px' },
  { id: 'tablet', label: 'Tablet', icon: <Tablet className="w-4 h-4" />, width: '768px' },
  { id: 'desktop', label: 'Desktop', icon: <Monitor className="w-4 h-4" />, width: '1024px' },
  { id: 'full', label: 'Full', icon: <Maximize2 className="w-4 h-4" />, width: '100%' },
];

export const ViewportToolbar: React.FC<ViewportToolbarProps> = ({
  viewport,
  onViewportChange,
}) => {
  return (
    <div className="flex items-center space-x-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1">
      {VIEWPORT_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onViewportChange(option.id)}
          className={`flex items-center space-x-1 px-2 py-1.5 rounded text-sm transition-colors ${
            viewport === option.id
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
          title={`${option.label} (${option.width})`}
        >
          {option.icon}
          <span className="hidden md:inline text-xs">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export { VIEWPORT_OPTIONS };
