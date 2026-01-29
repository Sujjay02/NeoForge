import React, { useMemo } from 'react';
import { computeDiff, getDiffStats, areCodesIdentical } from '../utils/diffUtils';
import { Plus, Minus, Equal, Check } from 'lucide-react';

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  oldLabel?: string;
  newLabel?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldCode,
  newCode,
  oldLabel = 'Previous',
  newLabel = 'Current',
}) => {
  const diff = useMemo(() => computeDiff(oldCode, newCode), [oldCode, newCode]);
  const stats = useMemo(() => getDiffStats(diff), [diff]);
  const identical = useMemo(() => areCodesIdentical(oldCode, newCode), [oldCode, newCode]);

  if (identical) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-zinc-400">
        <Check className="w-12 h-12 text-green-500 mb-4" />
        <p className="text-lg">No changes detected</p>
        <p className="text-sm text-zinc-500 mt-1">The code is identical</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 font-mono text-sm">
      {/* Header with stats */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center space-x-2">
          <span className="text-zinc-300 font-medium">{oldLabel}</span>
          <span className="text-zinc-500">→</span>
          <span className="text-zinc-300 font-medium">{newLabel}</span>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <span className="flex items-center text-green-400">
            <Plus className="w-3 h-3 mr-1" />
            {stats.added} added
          </span>
          <span className="flex items-center text-red-400">
            <Minus className="w-3 h-3 mr-1" />
            {stats.removed} removed
          </span>
          <span className="flex items-center text-zinc-500">
            <Equal className="w-3 h-3 mr-1" />
            {stats.unchanged} unchanged
          </span>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <tbody>
            {diff.map((line, idx) => (
              <tr
                key={idx}
                className={`${
                  line.type === 'added'
                    ? 'bg-green-500/10'
                    : line.type === 'removed'
                    ? 'bg-red-500/10'
                    : ''
                }`}
              >
                {/* Old line number */}
                <td className="w-12 text-right pr-2 text-zinc-600 select-none border-r border-zinc-800 py-0.5">
                  {line.oldLineNumber || ''}
                </td>
                {/* New line number */}
                <td className="w-12 text-right pr-2 text-zinc-600 select-none border-r border-zinc-800 py-0.5">
                  {line.newLineNumber || ''}
                </td>
                {/* Change indicator */}
                <td
                  className={`w-6 text-center select-none py-0.5 ${
                    line.type === 'added'
                      ? 'text-green-400 bg-green-500/20'
                      : line.type === 'removed'
                      ? 'text-red-400 bg-red-500/20'
                      : 'text-zinc-600'
                  }`}
                >
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </td>
                {/* Content */}
                <td
                  className={`pl-2 py-0.5 whitespace-pre-wrap break-all ${
                    line.type === 'added'
                      ? 'text-green-300'
                      : line.type === 'removed'
                      ? 'text-red-300'
                      : 'text-zinc-400'
                  }`}
                >
                  {line.content || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
