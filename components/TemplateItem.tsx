'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TemplateWithTags } from '@/types/database.types';

interface TemplateItemProps {
  template: TemplateWithTags;
  onApply: (template: TemplateWithTags) => void;
  onEdit: (template: TemplateWithTags) => void;
  onDuplicate: (template: TemplateWithTags) => void;
  onDelete: (id: string) => void;
}

export default function TemplateItem({ template, onApply, onEdit, onDuplicate, onDelete }: TemplateItemProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete template "${template.name}"?`)) return;

    setDeleting(true);
    const supabase = createClient();

    // Delete tag assignments first, then template
    await supabase
      .from('template_tag_assignments')
      .delete()
      .eq('template_id', template.id);

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', template.id);

    if (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
      setDeleting(false);
      return;
    }

    onDelete(template.id);
  };

  const preview = [
    template.client,
    template.matter,
    template.time_amount ? `${template.time_amount}h` : null,
  ].filter(Boolean).join(' / ');

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 transition-colors ${deleting ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white truncate">
            {template.name}
          </div>
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {template.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {preview && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {preview}
            </p>
          )}
        </div>
        <div className="flex gap-1 ml-3 flex-shrink-0">
          {/* Apply */}
          <button
            onClick={() => onApply(template)}
            disabled={deleting}
            className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
            title="Apply template"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          {/* Edit */}
          <button
            onClick={() => onEdit(template)}
            disabled={deleting}
            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
            title="Edit template"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          {/* Duplicate */}
          <button
            onClick={() => onDuplicate(template)}
            disabled={deleting}
            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
            title="Duplicate template"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
          </button>
          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Delete template"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
