import React, { useState, useEffect } from 'react';
import {
  X, Github, Loader2, Check, AlertCircle, Plus, Lock, Unlock,
  ExternalLink, RefreshCw, LogOut, Key, ChevronRight
} from 'lucide-react';
import {
  GitHubUser, GitHubRepo,
  getStoredToken, getStoredUser, authenticateWithToken, logout,
  fetchUserRepos, createRepo, pushToRepo, isGitHubConfigured
} from '../services/githubService';

interface GitHubExportDialogProps {
  code: string;
  explanation: string;
  onClose: () => void;
}

type Step = 'auth' | 'select-repo' | 'create-repo' | 'pushing' | 'success';

export const GitHubExportDialog: React.FC<GitHubExportDialogProps> = ({
  code,
  explanation,
  onClose,
}) => {
  const [step, setStep] = useState<Step>('auth');
  const [token, setToken] = useState<string>(getStoredToken() || '');
  const [tokenInput, setTokenInput] = useState('');
  const [user, setUser] = useState<GitHubUser | null>(getStoredUser());
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // New repo form
  const [newRepoName, setNewRepoName] = useState(() =>
    explanation.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 50) || 'neoforge-project'
  );
  const [newRepoDescription, setNewRepoDescription] = useState(explanation);
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);

  // Success state
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [pagesUrl, setPagesUrl] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    if (token && user) {
      setStep('select-repo');
      loadRepos();
    }
  }, []);

  const loadRepos = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const fetchedRepos = await fetchUserRepos(token);
      setRepos(fetchedRepos);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('Invalid') || err.message.includes('expired')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = async () => {
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const authenticatedUser = await authenticateWithToken(tokenInput.trim());
      setToken(tokenInput.trim());
      setUser(authenticatedUser);
      setStep('select-repo');

      // Load repos
      const fetchedRepos = await fetchUserRepos(tokenInput.trim());
      setRepos(fetchedRepos);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setToken('');
    setUser(null);
    setRepos([]);
    setStep('auth');
    setTokenInput('');
  };

  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
  };

  const handleCreateRepo = async () => {
    if (!token || !newRepoName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const repo = await createRepo(token, newRepoName.trim(), newRepoDescription, newRepoPrivate);
      setSelectedRepo(repo);
      setRepos(prev => [repo, ...prev]);

      // Immediately push to the new repo
      await handlePush(repo);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePush = async (repo?: GitHubRepo) => {
    const targetRepo = repo || selectedRepo;
    if (!token || !targetRepo || !user) return;

    setStep('pushing');
    setLoading(true);
    setError(null);
    try {
      const result = await pushToRepo(
        token,
        user.login,
        targetRepo.name,
        code,
        explanation,
        targetRepo.default_branch || 'main'
      );

      setResultUrl(result.html_url);
      setPagesUrl(result.pages_url);
      setStep('success');
    } catch (err: any) {
      setError(err.message);
      setStep('select-repo');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Export to GitHub</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step: Authentication */}
        {step === 'auth' && (
          <div className="p-4 space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <Github className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                Connect to GitHub
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Enter your GitHub Personal Access Token to push code to your repositories.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Personal Access Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleTokenSubmit()}
                  />
                </div>
              </div>

              <button
                onClick={handleTokenSubmit}
                disabled={loading || !tokenInput.trim()}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 text-center">
                Need a token?{' '}
                <a
                  href="https://github.com/settings/tokens/new?description=NeoForge&scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  Create one here
                </a>
                {' '}with "repo" scope.
              </p>
            </div>
          </div>
        )}

        {/* Step: Select Repository */}
        {step === 'select-repo' && (
          <div className="flex flex-col max-h-[60vh]">
            {/* User Info */}
            {user && (
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">
                      {user.name || user.login}
                    </div>
                    <div className="text-xs text-zinc-500">@{user.login}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center space-x-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Search and Create */}
            <div className="p-4 space-y-3 border-b border-zinc-200 dark:border-zinc-800">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search repositories..."
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setStep('create-repo')}
                className="w-full flex items-center justify-center space-x-2 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Repository</span>
              </button>
            </div>

            {/* Repository List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  {repos.length === 0 ? 'No repositories found' : 'No matching repositories'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredRepos.map((repo) => (
                    <button
                      key={repo.full_name}
                      onClick={() => handleSelectRepo(repo)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        selectedRepo?.full_name === repo.full_name
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {repo.private ? (
                          <Lock className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <Unlock className="w-4 h-4 text-zinc-400" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {repo.name}
                          </div>
                          <div className="text-xs text-zinc-500">{repo.full_name}</div>
                        </div>
                      </div>
                      {selectedRepo?.full_name === repo.full_name && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Push Button */}
            {selectedRepo && (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => handlePush()}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  <span>Push to {selectedRepo.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Create Repository */}
        {step === 'create-repo' && (
          <div className="p-4 space-y-4">
            <button
              onClick={() => setStep('select-repo')}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center space-x-1"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Back to repositories</span>
            </button>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value.replace(/[^a-z0-9-]/gi, '-'))}
                  placeholder="my-awesome-project"
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newRepoDescription}
                  onChange={(e) => setNewRepoDescription(e.target.value)}
                  placeholder="A brief description of your project"
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setNewRepoPrivate(!newRepoPrivate)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                    newRepoPrivate
                      ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {newRepoPrivate ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">Private</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span className="text-sm">Public</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleCreateRepo}
                disabled={loading || !newRepoName.trim()}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create & Push</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step: Pushing */}
        {step === 'pushing' && (
          <div className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
              Pushing to GitHub...
            </h3>
            <p className="text-sm text-zinc-500">
              Creating index.html in your repository
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                Successfully Pushed!
              </h3>
              <p className="text-sm text-zinc-500">
                Your code is now on GitHub
              </p>
            </div>

            <div className="space-y-2">
              {resultUrl && (
                <a
                  href={resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span>View on GitHub</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {pagesUrl && (
                <a
                  href={pagesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Live (GitHub Pages)</span>
                </a>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
