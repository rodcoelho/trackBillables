'use client';

import { useState, useEffect } from 'react';
import type { TemplateWithTags } from '@/types/database.types';

interface TemplateSelectorProps {
  onSelect: (template: TemplateWithTags) => void;
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateWithTags[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.client && t.client.toLowerCase().includes(q)) ||
      (t.matter && t.matter.toLowerCase().includes(q)) ||
      t.tags.some((tag) => tag.name.toLowerCase().includes(q))
    );
  });

  const handleSelect = (template: TemplateWithTags) => {
    onSelect(template);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-amber-600 text-white font-medium rounded-md shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        Template
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => { setIsOpen(false); setSearch(''); }}
          />
          <div className="absolute left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
            {/* Search */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            </div>

            {/* Template list */}
            <div className="max-h-60 overflow-y-auto">
              {loading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {templates.length === 0 ? 'No templates yet' : 'No matching templates'}
                </div>
              )}

              {!loading && filtered.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleSelect(template)}
                  className="w-full text-left px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {template.name}
                    </span>
                    {template.tags.slice(0, 2).map((tag) => (
                      <span key={tag.id} className="inline-flex flex-shrink-0 items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                        {tag.name}
                      </span>
                    ))}
                    {template.tags.length > 2 && (
                      <span className="flex-shrink-0 text-[10px] text-gray-400">+{template.tags.length - 2}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {[template.client, template.matter].filter(Boolean).join(' / ') || 'No details'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
