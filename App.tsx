import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { InputArea } from './components/InputArea';
import { CodePreview } from './components/CodePreview';
import { CodeViewer } from './components/CodeViewer';
import { PythonRunner } from './components/PythonRunner';
import { HistorySidebar } from './components/HistorySidebar';
import { LiveEditor } from './components/LiveEditor';
import { ViewportToolbar } from './components/ViewportToolbar';
import { ExportDialog } from './components/ExportDialog';
import { TemplateGallery } from './components/TemplateGallery';
import { DiffViewer } from './components/DiffViewer';
import { AssetManager } from './components/AssetManager';
import { ShareDialog } from './components/ShareDialog';
import { generateUI } from './services/geminiService';
import { saveHistory, loadHistory } from './services/storageService';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { decodeShareUrl, hasShareParameter, clearShareParameter } from './utils/urlUtils';
import { GeneratedUI, HistoryItem, UploadedFile, Viewport, ViewMode } from './types';
import {
  Code2, Eye, Loader2, Sparkles, AlertTriangle, RefreshCcw, Terminal, ExternalLink,
  Rocket, ArrowRight, Activity, Box, LayoutDashboard, Globe, Calculator, Kanban,
  CloudSun, Gamepad2, ShoppingCart, Music, Download, Share2, Layers, Edit3, GitCompare, Image
} from 'lucide-react';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedUI | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');

  // New feature state
  const [viewport, setViewport] = useState<Viewport>('full');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showAssetManager, setShowAssetManager] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [assets, setAssets] = useState<UploadedFile[]>([]);
  const [diffTarget, setDiffTarget] = useState<HistoryItem | null>(null);
  const [editedCode, setEditedCode] = useState<string>('');

  // Theme State
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('neoforge-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Starter Prompts State (Randomized on mount)
  const [starterPrompts] = useState(() => {
    const allPrompts = [
      {
        icon: <Box className="w-5 h-5 text-purple-500" />,
        title: "Lorenz Attractor 3D",
        description: "Interactive react-three-fiber visualization.",
        prompt: "Generate a 3D visualization of the Lorenz Attractor using react-three-fiber. Include sliders to control the parameters Sigma, Rho, and Beta. Trace the path of the particle over time and make the plot interactive."
      },
      {
        icon: <LayoutDashboard className="w-5 h-5 text-blue-500" />,
        title: "SaaS Dashboard",
        description: "Modern analytics dashboard with charts.",
        prompt: "Create a modern dark-themed SaaS dashboard with a sidebar navigation, a top header with user profile, and a main grid layout containing 4 stat cards (Revenue, Users, Bounce Rate, Active) and a large placeholder for a main chart."
      },
      {
        icon: <Activity className="w-5 h-5 text-green-500" />,
        title: "Python Data Analysis",
        description: "Generate synthetic data and plot it.",
        prompt: "Write a Python script that generates a synthetic dataset of monthly sales for 3 different products over 2 years. Calculate the rolling average and plot the results using matplotlib with a dark theme."
      },
      {
        icon: <Globe className="w-5 h-5 text-indigo-500" />,
        title: "Startup Landing Page",
        description: "Hero section with features and pricing.",
        prompt: "Create a landing page for a SaaS startup. Include a hero section with a gradient headline, a 'Features' grid with 3 cards, and a 'Pricing' section with 3 tiers. Use a modern, clean design with Tailwind CSS."
      },
      {
        icon: <Calculator className="w-5 h-5 text-orange-500" />,
        title: "React Calculator",
        description: "Functional calculator with history tape.",
        prompt: "Build a fully functional calculator component in React. It should support basic arithmetic operations, have a clean grid layout for buttons, and display a history tape of recent calculations on the side."
      },
      {
        icon: <Kanban className="w-5 h-5 text-pink-500" />,
        title: "Kanban Board",
        description: "Task management board with columns.",
        prompt: "Create a Kanban board UI with three columns: 'To Do', 'In Progress', and 'Done'. Include a button to add new tasks and style the task cards to look like sticky notes."
      },
      {
        icon: <CloudSun className="w-5 h-5 text-sky-500" />,
        title: "Weather Dashboard",
        description: "Weather forecast with current conditions.",
        prompt: "Design a weather dashboard card. It should show the current temperature (large font), condition icon, humidity, wind speed, and a horizontal list for the 5-day forecast. Use a glassmorphism style."
      },
      {
        icon: <Gamepad2 className="w-5 h-5 text-red-500" />,
        title: "Snake Game",
        description: "Classic Snake game using HTML5 Canvas.",
        prompt: "Create a fully playable Snake game using React and HTML5 Canvas. Implement controls using arrow keys, score tracking, and a game over screen."
      },
      {
        icon: <ShoppingCart className="w-5 h-5 text-yellow-500" />,
        title: "E-commerce Product",
        description: "Product details with gallery and cart.",
        prompt: "Build an e-commerce product detail page. It should feature a main image with thumbnail gallery, product title, price, size selector, quantity input, and an 'Add to Cart' button."
      },
      {
        icon: <Music className="w-5 h-5 text-rose-500" />,
        title: "Music Player",
        description: "Audio player with waveform visualizer.",
        prompt: "Create a sleek music player interface. It needs play/pause/skip controls, a progress bar, volume slider, and a visual representation of the audio waveform. Use a dark, futuristic aesthetic."
      }
    ];

    for (let i = allPrompts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPrompts[i], allPrompts[j]] = [allPrompts[j], allPrompts[i]];
    }

    return allPrompts.slice(0, 3);
  });

  // Load history from IndexedDB on mount
  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  // Save history to IndexedDB when it changes
  useEffect(() => {
    if (history.length > 0) {
      saveHistory(history);
    }
  }, [history]);

  // Handle share URL on mount
  useEffect(() => {
    if (hasShareParameter()) {
      const shared = decodeShareUrl(window.location.href);
      if (shared) {
        setResult({ code: shared.code, explanation: shared.explanation });
        setViewMode('preview');
        clearShareParameter();
      }
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('neoforge-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('neoforge-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleReset = useCallback(() => {
    setPrompt('');
    setFiles([]);
    setResult(null);
    setCurrentHistoryId(undefined);
    setError(null);
    setViewMode('preview');
    setDiffTarget(null);
    setEditedCode('');
  }, []);

  const isPythonCode = (code: string) => {
    const trimmed = code.trim();
    return !trimmed.startsWith('<!DOCTYPE') && !trimmed.startsWith('<html');
  };

  const handleGenerate = useCallback(async (overridePrompt?: string, overrideCode?: string) => {
    const promptToUse = overridePrompt || prompt;

    if (!promptToUse.trim() && files.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const previousCode = overrideCode || (result ? result.code : undefined);

      const data = await generateUI(promptToUse, files, previousCode);

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        prompt: promptToUse || (files.length > 0 ? 'File Analysis' : 'Generated UI'),
        files: [...files],
        result: data,
        timestamp: Date.now(),
        isPublished: false,
      };

      setHistory(prev => [...prev, newHistoryItem]);
      setResult(data);
      setCurrentHistoryId(newHistoryItem.id);
      setEditedCode('');

      if (isPythonCode(data.code)) {
        setViewMode('python');
      } else {
        setViewMode('preview');
      }

      setFiles([]);
      setPrompt('');

    } catch (err: any) {
      setError(err.message || 'Failed to generate UI. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [prompt, files, result]);

  const handleFixPythonError = useCallback((currentCode: string, errorMsg: string) => {
    const fixPrompt = `Fix the following Python error. Ensure the code is correct and runnable:\n\n${errorMsg}`;
    setPrompt(fixPrompt);
    handleGenerate(fixPrompt, currentCode);
  }, [handleGenerate]);

  const handleSelectHistory = (item: HistoryItem) => {
    setResult(item.result);
    setCurrentHistoryId(item.id);
    setEditedCode('');
    setDiffTarget(null);

    if (isPythonCode(item.result.code)) {
      setViewMode('python');
    } else {
      setViewMode('preview');
    }

    setFiles([]);
    setPrompt('');
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentHistoryId === id) {
      handleReset();
    }
  };

  const handleTogglePublish = () => {
    if (!currentHistoryId) return;

    setHistory(prev => prev.map(item => {
      if (item.id === currentHistoryId) {
        return { ...item, isPublished: !item.isPublished };
      }
      return item;
    }));
  };

  const handleCodeChange = useCallback((newCode: string) => {
    setEditedCode(newCode);
  }, []);

  const handleTemplateSelect = (code: string, explanation: string) => {
    setResult({ code, explanation });
    setViewMode('preview');
    setShowTemplateGallery(false);
  };

  const handleAddAsset = (asset: UploadedFile) => {
    setAssets(prev => [...prev, asset]);
  };

  const handleRemoveAsset = (index: number) => {
    setAssets(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompareWithHistory = (item: HistoryItem) => {
    setDiffTarget(item);
    setViewMode('diff');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Enter',
      meta: true,
      handler: () => handleGenerate(),
      description: 'Generate'
    },
    {
      key: 'k',
      meta: true,
      handler: () => { setPrompt(''); setFiles([]); },
      description: 'Clear input'
    },
    {
      key: 'b',
      meta: true,
      handler: () => setIsSidebarOpen(prev => !prev),
      description: 'Toggle sidebar'
    },
    {
      key: '1',
      meta: true,
      handler: () => setViewMode('preview'),
      description: 'Preview mode'
    },
    {
      key: '2',
      meta: true,
      handler: () => setViewMode('code'),
      description: 'Code mode'
    },
    {
      key: '3',
      meta: true,
      handler: () => setViewMode('editor'),
      description: 'Editor mode'
    },
    {
      key: 'e',
      meta: true,
      handler: () => result && setShowExportDialog(true),
      description: 'Export'
    },
    {
      key: 's',
      meta: true,
      shift: true,
      handler: () => result && setShowShareDialog(true),
      description: 'Share'
    },
  ]);

  const getErrorDetails = (errorMsg: string) => {
    if (errorMsg.includes("API Key")) {
      return {
        title: "Configuration Issue",
        message: errorMsg,
        suggestion: "Ensure your API_KEY is correctly set in the environment variables."
      };
    }
    if (errorMsg.includes("quota") || errorMsg.includes("429")) {
      return {
        title: "Rate Limit Exceeded",
        message: "You've made too many requests in a short time.",
        suggestion: "Please wait a moment before trying again."
      };
    }
    if (errorMsg.includes("overloaded") || errorMsg.includes("503")) {
      return {
        title: "Service Busy",
        message: "Google's AI service is experiencing high traffic.",
        suggestion: "Try again in a few minutes."
      };
    }
    if (errorMsg.includes("parse") || errorMsg.includes("JSON")) {
      return {
        title: "Generation Error",
        message: "The AI failed to format the code correctly.",
        suggestion: "Try simplifying your prompt or adding more details."
      };
    }
    return {
      title: "Unexpected Error",
      message: errorMsg,
      suggestion: "Please check your connection and try again."
    };
  };

  const handleStarterClick = (starterPrompt: string) => {
    setPrompt(starterPrompt);
    handleGenerate(starterPrompt);
  };

  const isCurrentResultPython = result ? isPythonCode(result.code) : false;
  const currentItem = history.find(h => h.id === currentHistoryId);
  const isPublished = currentItem?.isPublished || false;
  const currentCode = editedCode || result?.code || '';

  return (
    <div className="flex flex-col h-screen bg-background text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-300">
      <Header isDark={isDark} toggleTheme={toggleTheme} onReset={handleReset} />

      <div className="flex flex-1 overflow-hidden relative">
        <HistorySidebar
          history={history}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          onNewChat={handleReset}
          currentId={currentHistoryId}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        <main className="flex-1 flex flex-col relative overflow-hidden w-full">
          <div className="flex-1 flex flex-col overflow-hidden w-full px-4 pt-4 pb-24 max-w-7xl mx-auto">

            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Ready to Forge</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-2 text-lg">
                      What will you build today?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl px-4">
                  {starterPrompts.map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStarterClick(starter.prompt)}
                      className="flex flex-col text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors">
                          {starter.icon}
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transform group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-1">{starter.title}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {starter.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setShowTemplateGallery(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                  >
                    <Layers className="w-4 h-4" />
                    Browse Templates
                  </button>
                  <button
                    onClick={() => setShowAssetManager(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                  >
                    <Image className="w-4 h-4" />
                    Manage Assets
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-pulse">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
                  {result ? "Refining your interface..." : "Forging your interface..."}
                </p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md w-full backdrop-blur-sm">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-red-500/10 rounded-full">
                      <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-200 mb-2">{getErrorDetails(error).title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">{getErrorDetails(error).message}</p>

                  <div className="bg-white/50 dark:bg-zinc-900/50 rounded-lg p-3 text-sm text-zinc-600 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800">
                    <span className="font-medium text-zinc-500 dark:text-zinc-400">Suggestion: </span>
                    {getErrorDetails(error).suggestion}
                  </div>

                  <button
                    onClick={() => handleGenerate()}
                    className="mt-6 w-full py-2.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-200 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-800/30 flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {result && !loading && !error && (
              <div className="flex flex-col h-full bg-surface border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xl transition-colors duration-300">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 gap-3 sm:gap-0">
                  <div className="flex flex-col space-y-1 overflow-hidden">
                    <div className="flex items-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                      <span className="font-medium truncate max-w-md">{result.explanation}</span>
                    </div>
                    {result.sources && result.sources.length > 0 && (
                      <div className="flex items-center space-x-2 text-xs overflow-x-auto no-scrollbar">
                        <span className="text-zinc-400 shrink-0">Sources:</span>
                        {result.sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full whitespace-nowrap transition-colors"
                            title={source.title}
                          >
                            <span className="max-w-[100px] truncate">{source.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0 self-end sm:self-auto">
                    {/* Viewport Toolbar - only show in preview mode */}
                    {viewMode === 'preview' && !isCurrentResultPython && (
                      <ViewportToolbar viewport={viewport} onViewportChange={setViewport} />
                    )}

                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800">
                      {/* Publish Toggle */}
                      <button
                        onClick={handleTogglePublish}
                        className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm transition-all ${
                          isPublished
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-500/30'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                        }`}
                        title={isPublished ? "Unpublish App" : "Publish as App"}
                      >
                        <Rocket className={`w-4 h-4 ${isPublished ? 'fill-current' : ''}`} />
                      </button>

                      <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>

                      {/* View Mode Buttons */}
                      {!isCurrentResultPython && (
                        <button
                          onClick={() => setViewMode('preview')}
                          className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm transition-all ${
                            viewMode === 'preview'
                              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                          }`}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {isCurrentResultPython && (
                        <button
                          onClick={() => setViewMode('python')}
                          className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm transition-all ${
                            viewMode === 'python'
                              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                          }`}
                          title="Python"
                        >
                          <Terminal className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setViewMode('code')}
                        className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm transition-all ${
                          viewMode === 'code'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                        }`}
                        title="Source Code"
                      >
                        <Code2 className="w-4 h-4" />
                      </button>

                      {!isCurrentResultPython && (
                        <button
                          onClick={() => {
                            setEditedCode(result.code);
                            setViewMode('editor');
                          }}
                          className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm transition-all ${
                            viewMode === 'editor'
                              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                          }`}
                          title="Live Editor"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {history.length > 1 && (
                        <button
                          onClick={() => {
                            const previousItem = history.find(h => h.id !== currentHistoryId);
                            if (previousItem) {
                              setDiffTarget(previousItem);
                              setViewMode('diff');
                            }
                          }}
                          className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm transition-all ${
                            viewMode === 'diff'
                              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                          }`}
                          title="Compare Versions"
                        >
                          <GitCompare className="w-4 h-4" />
                        </button>
                      )}

                      <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>

                      {/* Action Buttons */}
                      <button
                        onClick={() => setShowExportDialog(true)}
                        className="flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-all"
                        title="Export"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setShowShareDialog(true)}
                        className="flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-all"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setShowTemplateGallery(true)}
                        className="flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-all"
                        title="Templates"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Viewport */}
                <div className="flex-1 overflow-hidden relative bg-zinc-100 dark:bg-[#0d0d10]">
                  {viewMode === 'preview' && !isCurrentResultPython && (
                    <CodePreview html={currentCode} viewport={viewport} />
                  )}
                  {viewMode === 'python' && isCurrentResultPython && (
                    <PythonRunner
                      code={result.code}
                      onFixError={handleFixPythonError}
                    />
                  )}
                  {viewMode === 'code' && (
                    <CodeViewer code={currentCode} explanation={result.explanation} />
                  )}
                  {viewMode === 'editor' && !isCurrentResultPython && (
                    <LiveEditor
                      code={currentCode}
                      onCodeChange={handleCodeChange}
                      language="html"
                      viewport={viewport}
                    />
                  )}
                  {viewMode === 'diff' && diffTarget && (
                    <DiffViewer
                      oldCode={diffTarget.result.code}
                      newCode={currentCode}
                      oldLabel={diffTarget.result.explanation}
                      newLabel={result.explanation}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-10 transition-colors duration-300">
            <div className="max-w-3xl mx-auto">
              <InputArea
                prompt={prompt}
                setPrompt={setPrompt}
                files={files}
                setFiles={setFiles}
                onGenerate={() => handleGenerate()}
                loading={loading}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      {showExportDialog && result && (
        <ExportDialog
          code={currentCode}
          explanation={result.explanation}
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {showTemplateGallery && (
        <TemplateGallery
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateGallery(false)}
          currentCode={result?.code}
          currentExplanation={result?.explanation}
        />
      )}

      {showAssetManager && (
        <AssetManager
          assets={assets}
          onAddAsset={handleAddAsset}
          onRemoveAsset={handleRemoveAsset}
          onClose={() => setShowAssetManager(false)}
        />
      )}

      {showShareDialog && result && (
        <ShareDialog
          code={currentCode}
          explanation={result.explanation}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  );
};

export default App;
