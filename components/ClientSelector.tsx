// @ts-nocheck - TODO: Fix Supabase client type definitions
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import CreateClientModal from '@/components/CreateClientModal';
import type { Client } from '@/types/database.types';

interface ClientSelectorProps {
  value: string;
  clientId: string | null;
  onChange: (name: string, id: string | null) => void;
  required?: boolean;
  placeholder?: string;
}

export default function ClientSelector({ value, clientId, onChange, required = true, placeholder = 'e.g., Smith' }: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createInitialName, setCreateInitialName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (!error && data) {
        setClients(data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (client: Client) => {
    onChange(client.name, client.id);
    setSearch('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val, null);
    if (!isOpen && val) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setSearch(value);
    setIsOpen(true);
  };

  const handleCreateClick = () => {
    setCreateInitialName(search || value);
    setShowCreateModal(true);
  };

  const handleClientCreated = (client: Client) => {
    setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    onChange(client.name, client.id);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          required={required}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          autoComplete="off"
        />

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => { setIsOpen(false); setSearch(''); }}
            />
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
              <div className="max-h-48 overflow-y-auto">
                {loading && (
                  <div className="flex justify-center py-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  </div>
                )}

                {!loading && filtered.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No matching clients
                  </div>
                )}

                {!loading && filtered.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(client)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${
                      client.id === clientId ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {client.name}
                  </button>
                ))}
              </div>

              {/* Create new client */}
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCreateClick}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create new client
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <CreateClientModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleClientCreated}
        initialName={createInitialName}
      />
    </>
  );
}
