import { get, set, del } from 'idb-keyval';
import { SavedTemplate, HistoryItem } from '../types';

const TEMPLATES_KEY = 'neoforge-templates';
const HISTORY_KEY = 'neoforge-history';

/**
 * Template Storage
 */
export async function saveTemplate(template: SavedTemplate): Promise<void> {
  const templates = await getTemplates();
  templates.push(template);
  await set(TEMPLATES_KEY, templates);
}

export async function getTemplates(): Promise<SavedTemplate[]> {
  try {
    const templates = await get<SavedTemplate[]>(TEMPLATES_KEY);
    return templates || [];
  } catch (e) {
    console.error('Failed to load templates:', e);
    return [];
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await getTemplates();
  const filtered = templates.filter((t) => t.id !== id);
  await set(TEMPLATES_KEY, filtered);
}

export async function updateTemplate(id: string, updates: Partial<SavedTemplate>): Promise<void> {
  const templates = await getTemplates();
  const index = templates.findIndex((t) => t.id === id);
  if (index !== -1) {
    templates[index] = { ...templates[index], ...updates };
    await set(TEMPLATES_KEY, templates);
  }
}

/**
 * History Storage
 */
export async function saveHistory(history: HistoryItem[]): Promise<void> {
  try {
    await set(HISTORY_KEY, history);
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

export async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const history = await get<HistoryItem[]>(HISTORY_KEY);
    return history || [];
  } catch (e) {
    console.error('Failed to load history:', e);
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await del(HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear history:', e);
  }
}

/**
 * Create a new template from current generation
 */
export function createTemplate(
  name: string,
  description: string,
  code: string,
  category: string = 'custom',
  tags: string[] = []
): SavedTemplate {
  return {
    id: Date.now().toString(),
    name,
    description,
    code,
    category,
    createdAt: Date.now(),
    tags,
  };
}
