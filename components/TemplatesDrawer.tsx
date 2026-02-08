// @ts-nocheck - TODO: Fix Supabase client type definitions
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import TemplateItem from '@/components/TemplateItem';
import CreateTemplateModal from '@/components/CreateTemplateModal';
import type { TemplateWithTags, TemplateTag, Subscription } from '@/types/database.types';

interface TemplatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: TemplateWithTags) => void;
  subscription: Subscription | null;
}

export default function TemplatesDrawer({ isOpen, onClose, onApply, subscription }: TemplatesDrawerProps) {
  const [templates, setTemplates] = useState<TemplateWithTags[]>([]);
  const [allTags, setAllTags] = useState<TemplateTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<TemplateWithTags | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const supabase = createClient();

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data.templates || []);
      setAllTags(data.tags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const isPro = subscription?.tier === 'pro' && ['active', 'trialing'].includes(subscription.status);
  const templateLimit = isPro ? Infinity : 3;
  const canCreate = templates.length < templateLimit;

  const handleCreateClick = () => {
    if (!canCreate) {
      setShowUpgradePrompt(true);
      return;
    }
    setEditTemplate(null);
    setShowCreateModal(true);
  };

  const handleSaveTemplate = async (data: {
    name: string;
    client: string;
    matter: string;
    time_amount: string;
    description: string;
    tags: string[];
  }) => {
    if (editTemplate && editTemplate.id) {
      // Update existing template
      const { error: updateError } = await supabase
        .from('templates')
        .update({
          name: data.name,
          client: data.client || null,
          matter: data.matter || null,
          time_amount: data.time_amount ? parseFloat(data.time_amount) : null,
          description: data.description || null,
        })
        .eq('id', editTemplate.id);

      if (updateError) throw new Error('Failed to update template');

      // Update tag assignments: remove old, add new
      await supabase
        .from('template_tag_assignments')
        .delete()
        .eq('template_id', editTemplate.id);

      // Create/assign tags
      for (const tagName of data.tags) {
        let { data: existingTag } = await supabase
          .from('template_tags')
          .select('*')
          .eq('name', tagName)
          .single();

        if (!existingTag) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');
          const { data: newTag } = await supabase
            .from('template_tags')
            .insert({ user_id: user.id, name: tagName })
            .select()
            .single();
          existingTag = newTag;
        }

        if (existingTag) {
          await supabase
            .from('template_tag_assignments')
            .insert({ template_id: editTemplate.id, tag_id: existingTag.id });
        }
      }

      await fetchTemplates();
    } else {
      // Create new template via API (for limit checking)
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          client: data.client || null,
          matter: data.matter || null,
          time_amount: data.time_amount ? parseFloat(data.time_amount) : null,
          description: data.description || null,
          tags: data.tags,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.upgrade) {
          setShowUpgradePrompt(true);
        }
        throw new Error(result.message || result.error || 'Failed to create template');
      }

      await fetchTemplates();
    }
  };

  const handleEdit = (template: TemplateWithTags) => {
    setEditTemplate(template);
    setShowCreateModal(true);
  };

  const handleDuplicate = (template: TemplateWithTags) => {
    if (!canCreate) {
      setShowUpgradePrompt(true);
      return;
    }

    // Open modal pre-filled with copied data (no id so it creates a new one)
    setEditTemplate({
      ...template,
      id: '', // empty id signals a new template in handleSaveTemplate
      name: `Copy of ${template.name}`,
    });
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const handleApply = (template: TemplateWithTags) => {
    onApply(template);
    onClose();
  };

  const toggleTag = (tagName: string) => {
    setActiveTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  // Filter templates by search and active tags
  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      (t.client && t.client.toLowerCase().includes(q)) ||
      (t.matter && t.matter.toLowerCase().includes(q)) ||
      t.tags.some((tag) => tag.name.toLowerCase().includes(q));

    const matchesTags =
      activeTags.length === 0 ||
      activeTags.every((activeTag) =>
        t.tags.some((tag) => tag.name === activeTag)
      );

    return matchesSearch && matchesTags;
  });

  const handleUpgrade = async (interval: 'month' | 'year') => {
    try {
      const priceId = interval === 'month'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'price_1SefDaCnzNMpemDjuleE3Rjy'
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL || 'price_1SefDaCnzNMpemDjIl8Hku8y';

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[50vw] bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Templates
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, client, matter, or tag..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          {/* Tag filter chips */}
          {allTags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 overflow-x-auto">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeTags.includes(tag.name)
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Create button */}
          <button
            onClick={handleCreateClick}
            className="w-full mb-4 px-4 py-2.5 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Template
          </button>

          {/* Usage counter for free tier */}
          {!isPro && (
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {templates.length} of 3 templates used
              {templates.length >= 3 && (
                <>
                  {' — '}
                  <button
                    type="button"
                    onClick={() => setShowUpgradePrompt(true)}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    Upgrade for unlimited
                  </button>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          )}

          {/* Empty state */}
          {!loading && templates.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg mt-4">
                No templates yet.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Create your first template to save time on repetitive entries.
              </p>
            </div>
          )}

          {/* No search results */}
          {!loading && templates.length > 0 && filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No templates match your search.
            </div>
          )}

          {/* Template list */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((template) => (
                <TemplateItem
                  key={template.id}
                  template={template}
                  onApply={handleApply}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditTemplate(null);
        }}
        onSave={handleSaveTemplate}
        editTemplate={editTemplate}
        existingTags={allTags}
      />

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Upgrade to Pro
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You&apos;ve reached your free plan limit of 3 templates. Upgrade to Pro for unlimited templates!
              </p>

              <div className="space-y-3 mb-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border-2 border-indigo-500">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-left">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        $10<span className="text-sm font-normal">/month</span>
                      </div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400">
                        Billed monthly
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpgrade('month')}
                      className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Choose Monthly
                    </button>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-500 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      SAVE 20%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-left">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        $100<span className="text-sm font-normal">/year</span>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        $8.33/month &bull; Save $20
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpgrade('year')}
                      className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                    >
                      Choose Annual
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradePrompt(false)}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
