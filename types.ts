// Viewport types for responsive preview
export type Viewport = 'mobile' | 'tablet' | 'desktop' | 'full';

// View mode including new editor and diff modes
export type ViewMode = 'preview' | 'code' | 'python' | 'editor' | 'diff';

// Multi-file support
export interface GeneratedFile {
  filename: string;
  content: string;
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'python';
}

export interface GeneratedUI {
  explanation: string;
  code: string;
  files?: GeneratedFile[]; // Multi-file support
  sources?: { title: string; uri: string }[];
}

// Template storage
export interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  thumbnail?: string; // base64 screenshot
  category: string;
  createdAt: number;
  tags: string[];
}

export interface UploadedFile {
  data: string; // base64 string
  mimeType: string;
  fileName?: string;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  files?: UploadedFile[];
  result: GeneratedUI;
  timestamp: number;
  isPublished?: boolean;
}

export interface InputAreaProps {
  prompt: string;
  setPrompt: (prompt: string | ((prev: string) => string)) => void;
  files: UploadedFile[];
  setFiles: (files: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => void;
  onGenerate: () => void;
  loading: boolean;
}

export interface CodePreviewProps {
  html: string;
}

export interface CodeViewerProps {
  code: string;
  explanation?: string;
}

export interface PythonRunnerProps {
  code: string;
  onFixError?: (code: string, error: string) => void;
}

export interface HistorySidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  currentId?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
  onReset: () => void;
}
