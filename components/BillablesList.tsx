'use client';

import { useEffect, useState, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Billable } from '@/types/database.types';
import BillableItem from './BillableItem';

export interface BillablesListRef {
  refresh: () => Promise<void>;
}

const PAGE_SIZE = 50;

const BillablesList = forwardRef<BillablesListRef>((props, ref) => {
  const [billables, setBillables] = useState<Billable[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const supabase = createClient();
  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const fetchBillables = async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (append) {
        if (isLoadingRef.current) {
          return; // Prevent duplicate requests
        }
        isLoadingRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('billables')
        .select('*', { count: 'exact' })
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (append) {
        setBillables((prev) => {
          const updated = [...prev, ...(data || [])];
          // Check if there are more items to load
          const hasMoreItems = updated.length < (count || 0);
          setHasMore(hasMoreItems);
          return updated;
        });
      } else {
        const newData = data || [];
        setBillables(newData);
        const newTotalLoaded = newData.length;
        // Check if there are more items to load
        const hasMoreItems = newTotalLoaded < (count || 0);
        setHasMore(hasMoreItems);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch billables');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !isLoadingRef.current) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBillables(nextPage, true);
    }
  }, [page, loadingMore, hasMore]);

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      setPage(0);
      setHasMore(true);
      await fetchBillables(0, false);
    },
  }));

  useEffect(() => {
    fetchBillables();

    // Set up real-time subscription
    const channel = supabase
      .channel('billables_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'billables',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBillables((current) => {
              // Check if item already exists to prevent duplicates
              const exists = current.some(billable => billable.id === payload.new.id);
              if (exists) {
                return current;
              }
              return [payload.new as Billable, ...current];
            });
          } else if (payload.eventType === 'UPDATE') {
            setBillables((current) =>
              current.map((billable) =>
                billable.id === payload.new.id ? (payload.new as Billable) : billable
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setBillables((current) =>
              current.filter((billable) => billable.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    // Only set up observer if we have data and there's more to load
    if (!hasMore || billables.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoadingRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loadMore, billables.length]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('billables').delete().eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting billable:', err);
      alert('Failed to delete billable. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (billables.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No billables yet. Add your first entry above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {billables.map((billable) => (
        <BillableItem key={billable.id} billable={billable} onDelete={handleDelete} />
      ))}

      {/* Intersection observer target for infinite scroll */}
      {hasMore && (
        <div ref={observerTarget} className="py-4 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </div>
      )}

      {/* Show message when all items are loaded */}
      {!hasMore && billables.length > PAGE_SIZE && (
        <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          All entries loaded ({billables.length} total)
        </div>
      )}
    </div>
  );
});

BillablesList.displayName = 'BillablesList';

export default BillablesList;
