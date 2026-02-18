'use client';

import { useState, useEffect, useRef } from 'react';
import ClientSelector from '@/components/ClientSelector';
import type { TemplateWithTags, TemplateTag } from '@/types/database.types';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    client: string;
    client_id: string | null;
    matter: string;
    time_amount: string;
    description: string;
    tags: string[];
  }) => Promise<void>;
  editTemplate?: TemplateWithTags | null;
  existingTags: TemplateTag[];
}

export default function CreateTemplateModal({ isOpen, onClose, onSave, editTemplate, existingTags }: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [matter, setMatter] = useState('');
  const [timeAmount, setTimeAmount] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill when editing
  useEffect(() => {
    if (editTemplate) {
      setName(editTemplate.name);
      setClient(editTemplate.client || '');
      setClientId(editTemplate.client_id || null);
      setMatter(editTemplate.matter || '');
      setTimeAmount(editTemplate.time_amount?.toString() || '');
      setDescription(editTemplate.description || '');
      setTags(editTemplate.tags.map((t) => t.name));
    } else {
      setName('');
      setClient('');
      setClientId(null);
      setMatter('');
      setTimeAmount('');
      setDescription('');
      setTags([]);
    }
    setTagInput('');
    setError(null);
  }, [editTemplate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        client: client.trim(),
        client_id: clientId,
        matter: matter.trim(),
        time_amount: timeAmount,
        description: description.trim(),
        tags,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
    tagInputRef.current?.focus();
  };

  const removeTag = (tagName: string) => {
    setTags(tags.filter((t) => t !== tagName));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
      }
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = existingTags
    .filter((t) => !tags.includes(t.name))
    .filter((t) => t.name.toLowerCase().includes(tagInput.toLowerCase()))
    .slice(0, 5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editTemplate ? 'Edit Template' : 'Create Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Standard Discovery Review"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Client, Matter & Hours */}
            <div className="flex gap-4">
              <div style={{ width: '30%' }}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client
                </label>
                <ClientSelector
                  value={client}
                  clientId={clientId}
                  onChange={(name, id) => { setClient(name); setClientId(id); }}
                  required={false}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Matter
                </label>
                <input
                  type="text"
                  value={matter}
                  onChange={(e) => setMatter(e.target.value)}
                  placeholder="e.g., Smith v. Johnson - Discovery"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div style={{ width: '15%' }}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="24"
                  value={timeAmount}
                  onChange={(e) => setTimeAmount(e.target.value)}
                  placeholder="e.g., 1.5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Work description to pre-fill..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <div className="relative">
                <div className="flex flex-wrap gap-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 min-h-[42px] focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowTagSuggestions(e.target.value.length > 0);
                    }}
                    onKeyDown={handleTagKeyDown}
                    onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                    placeholder={tags.length === 0 ? 'Type a tag and press Enter...' : ''}
                    className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 dark:text-white text-sm"
                  />
                </div>

                {/* Tag suggestions dropdown */}
                {showTagSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                    {filteredSuggestions.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addTag(tag.name)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Press Enter or comma to add a tag
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex-1 px-4 py-3 bg-amber-600 text-white font-medium rounded-md shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : editTemplate ? 'Update Template' : 'Create Template'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
