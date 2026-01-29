/**
 * GitHub API Service for OAuth and repository operations
 * Uses GitHub OAuth with popup flow for client-side authentication
 */

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
const GITHUB_REDIRECT_URI = `${window.location.origin}/github-callback`;
const GITHUB_SCOPE = 'repo';

// Storage keys
const GITHUB_TOKEN_KEY = 'neoforge-github-token';
const GITHUB_USER_KEY = 'neoforge-github-user';

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  html_url: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
}

/**
 * Check if GitHub client ID is configured
 */
export function isGitHubConfigured(): boolean {
  return !!GITHUB_CLIENT_ID;
}

/**
 * Get stored GitHub token
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(GITHUB_TOKEN_KEY);
}

/**
 * Get stored GitHub user
 */
export function getStoredUser(): GitHubUser | null {
  const stored = localStorage.getItem(GITHUB_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Store GitHub credentials
 */
function storeCredentials(token: string, user: GitHubUser): void {
  localStorage.setItem(GITHUB_TOKEN_KEY, token);
  localStorage.setItem(GITHUB_USER_KEY, JSON.stringify(user));
}

/**
 * Clear GitHub credentials
 */
export function logout(): void {
  localStorage.removeItem(GITHUB_TOKEN_KEY);
  localStorage.removeItem(GITHUB_USER_KEY);
}

/**
 * Start OAuth flow with popup
 */
export function startOAuthFlow(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!GITHUB_CLIENT_ID) {
      reject(new Error('GitHub Client ID not configured. Add VITE_GITHUB_CLIENT_ID to your environment.'));
      return;
    }

    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('github-oauth-state', state);

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GITHUB_REDIRECT_URI);
    authUrl.searchParams.set('scope', GITHUB_SCOPE);
    authUrl.searchParams.set('state', state);

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl.toString(),
      'github-oauth',
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );

    if (!popup) {
      reject(new Error('Failed to open popup. Please allow popups for this site.'));
      return;
    }

    // Listen for callback message
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'github-oauth-callback') {
        window.removeEventListener('message', handleMessage);
        clearInterval(pollInterval);

        if (event.data.error) {
          reject(new Error(event.data.error));
        } else if (event.data.token) {
          resolve(event.data.token);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Poll to check if popup was closed
    const pollInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollInterval);
        window.removeEventListener('message', handleMessage);
        reject(new Error('Authentication cancelled'));
      }
    }, 500);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      window.removeEventListener('message', handleMessage);
      if (!popup.closed) {
        popup.close();
      }
      reject(new Error('Authentication timed out'));
    }, 5 * 60 * 1000);
  });
}

/**
 * Exchange code for token (requires backend proxy due to CORS)
 * For now, we'll use a personal access token approach
 */
export async function authenticateWithToken(token: string): Promise<GitHubUser> {
  const user = await fetchCurrentUser(token);
  storeCredentials(token, user);
  return user;
}

/**
 * Fetch current authenticated user
 */
export async function fetchCurrentUser(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error('Invalid or expired token');
    }
    throw new Error('Failed to fetch user info');
  }

  return response.json();
}

/**
 * Fetch user's repositories
 */
export async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
  const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }

  return response.json();
}

/**
 * Create a new repository
 */
export async function createRepo(
  token: string,
  name: string,
  description: string,
  isPrivate: boolean = false
): Promise<GitHubRepo> {
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      private: isPrivate,
      auto_init: true, // Create with README
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create repository');
  }

  return response.json();
}

/**
 * Create or update a file in a repository
 */
export async function createOrUpdateFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string = 'main',
  existingSha?: string
): Promise<{ sha: string; html_url: string }> {
  // Get current file SHA if it exists (for updates)
  let sha = existingSha;
  if (!sha) {
    try {
      const checkResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (checkResponse.ok) {
        const existing = await checkResponse.json();
        sha = existing.sha;
      }
    } catch {
      // File doesn't exist, that's fine
    }
  }

  const body: Record<string, any> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
    branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create file');
  }

  const result = await response.json();
  return {
    sha: result.content.sha,
    html_url: result.content.html_url,
  };
}

/**
 * Push code to a repository (creates index.html)
 */
export async function pushToRepo(
  token: string,
  owner: string,
  repo: string,
  code: string,
  explanation: string,
  branch: string = 'main'
): Promise<{ html_url: string; pages_url?: string }> {
  // Create/update index.html
  const result = await createOrUpdateFile(
    token,
    owner,
    repo,
    'index.html',
    code,
    `Update: ${explanation}\n\nGenerated with NeoForge`,
    branch
  );

  // Try to enable GitHub Pages (might fail if already enabled or not allowed)
  try {
    await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: {
          branch,
          path: '/',
        },
      }),
    });
  } catch {
    // Pages might already be enabled or not available
  }

  return {
    html_url: result.html_url,
    pages_url: `https://${owner}.github.io/${repo}/`,
  };
}
