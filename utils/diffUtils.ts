import { diffLines, Change } from 'diff';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

/**
 * Compute line-by-line diff between two code strings
 */
export function computeDiff(oldCode: string, newCode: string): DiffLine[] {
  const changes = diffLines(oldCode, newCode);
  const result: DiffLine[] = [];
  let oldLineNumber = 1;
  let newLineNumber = 1;

  changes.forEach((change: Change) => {
    const lines = change.value.split('\n');
    // Remove last empty line from split if the chunk ends with newline
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    lines.forEach((line) => {
      if (change.added) {
        result.push({
          type: 'added',
          content: line,
          oldLineNumber: null,
          newLineNumber: newLineNumber++,
        });
      } else if (change.removed) {
        result.push({
          type: 'removed',
          content: line,
          oldLineNumber: oldLineNumber++,
          newLineNumber: null,
        });
      } else {
        result.push({
          type: 'unchanged',
          content: line,
          oldLineNumber: oldLineNumber++,
          newLineNumber: newLineNumber++,
        });
      }
    });
  });

  return result;
}

/**
 * Get statistics about the diff
 */
export function getDiffStats(diff: DiffLine[]): DiffStats {
  return {
    added: diff.filter((d) => d.type === 'added').length,
    removed: diff.filter((d) => d.type === 'removed').length,
    unchanged: diff.filter((d) => d.type === 'unchanged').length,
  };
}

/**
 * Check if two code strings are identical
 */
export function areCodesIdentical(code1: string, code2: string): boolean {
  return code1.trim() === code2.trim();
}
