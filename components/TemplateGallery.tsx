import React, { useState, useEffect } from 'react';
import { X, Search, Grid3x3, List, Plus, Trash2, Tag } from 'lucide-react';
import { SavedTemplate } from '../types';
import { getTemplates, deleteTemplate, saveTemplate, createTemplate } from '../services/storageService';

interface TemplateGalleryProps {
  onSelect: (code: string, explanation: string) => void;
  onClose: () => void;
  currentCode?: string;
  currentExplanation?: string;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelect,
  onClose,
  currentCode,
  currentExplanation,
}) => {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', category: 'custom', tags: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const loaded = await getTemplates();
    setTemplates(loaded);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!currentCode || !newTemplate.name.trim()) return;

    const template = createTemplate(
      newTemplate.name.trim(),
      currentExplanation || '',
      currentCode,
      newTemplate.category,
      newTemplate.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    );

    await saveTemplate(template);
    await loadTemplates();
    setShowSaveDialog(false);
    setNewTemplate({ name: '', category: 'custom', tags: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this template?')) {
      await deleteTemplate(id);
      await loadTemplates();
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(templates.map((t) => t.category))];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Template Gallery</h2>
          <div className="flex items-center space-x-2">
            {currentCode && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Save Current</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Templates Grid/List */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center py-12 text-zinc-500">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-zinc-400 mb-2">
                {templates.length === 0
                  ? 'No templates saved yet'
                  : 'No templates match your search'}
              </div>
              {templates.length === 0 && currentCode && (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="text-blue-500 hover:text-blue-600 text-sm"
                >
                  Save your first template
                </button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'
              }
            >
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`group relative border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer ${
                    viewMode === 'list' ? 'flex items-center p-3' : ''
                  }`}
                  onClick={() => onSelect(template.code, template.description)}
                >
                  {viewMode === 'grid' && (
                    <div className="h-32 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm">
                      Preview
                    </div>
                  )}
                  <div className={`p-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <h3 className="font-medium text-zinc-900 dark:text-white truncate">
                      {template.name}
                    </h3>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{template.description}</p>
                    {template.tags.length > 0 && (
                      <div className="flex items-center mt-2 space-x-1 flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded"
                          >
                            <Tag className="w-2 h-2 mr-0.5" />
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="text-[10px] text-zinc-400">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete template"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-80 shadow-xl border border-zinc-200 dark:border-zinc-700">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Save as Template</h3>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Template name"
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg mb-3 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg mb-3 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="custom">Custom</option>
                <option value="dashboard">Dashboard</option>
                <option value="landing">Landing Page</option>
                <option value="form">Form</option>
                <option value="game">Game</option>
                <option value="data-viz">Data Visualization</option>
                <option value="3d">3D / WebGL</option>
              </select>
              <input
                type="text"
                value={newTemplate.tags}
                onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                placeholder="Tags (comma separated)"
                className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg mb-4 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!newTemplate.name.trim()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
