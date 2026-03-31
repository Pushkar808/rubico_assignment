'use client';

import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Sparkles, RefreshCw } from 'lucide-react';
import { useFeedStore } from '@/store/feed';
import { useAuthStore } from '@/store/auth';
import { FeedCard } from '@/components/FeedCard';
import { FeedSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/AppLayout';
import { interactionApi } from '@/lib/api';
import { extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';

const TYPES = [
  { value: '', label: 'All' },
  { value: 'event', label: 'Events' },
  { value: 'product', label: 'Products' },
];

const SORTS = [
  { value: 'recent', label: 'Recent' },
  { value: 'popular', label: 'Popular' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
];

export default function FeedPage() {
  const { user } = useAuthStore();
  const { items, isLoading, hasMore, fetchFeed, toggleInteraction, setFilter, filter } = useFeedStore();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFeed(true);
  }, [filter]); // eslint-disable-line

  const handleLoadMore = () => fetchFeed(false);

  const handleRegister = async (itemId: string) => {
    try {
      await interactionApi.toggle({ item_type: 'event', item_id: itemId, interaction_type: 'register' });
      toast.success('Registered for event!');
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-500" />
            Your Feed
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Latest events and products from organizations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchFeed(true)}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Type</label>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFilter({ type: t.value || undefined })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    (filter.type ?? '') === t.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Sort</label>
            <div className="flex gap-2 flex-wrap">
              {SORTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setFilter({ sort: s.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    (filter.sort ?? 'recent') === s.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Grid */}
      {isLoading && items.length === 0 ? (
        <FeedSkeleton count={6} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No items in your feed yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Organizations will post events and products here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item, idx) => (
              <FeedCard
                key={item.id}
                item={item}
                index={idx}
                onLike={() => toggleInteraction(item.id, item.item_type, 'like')}
                onSave={() => toggleInteraction(item.id, item.item_type, 'save')}
                onRegister={item.item_type === 'event' ? () => handleRegister(item.id) : undefined}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                isLoading={isLoading}
                size="lg"
              >
                Load more
              </Button>
            </div>
          )}

          {!hasMore && items.length > 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-600 mt-8">
              You've seen everything!
            </p>
          )}
        </>
      )}
    </AppLayout>
  );
}
