'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles, Mic, Filter } from 'lucide-react';
import { useSearchStore } from '@/store/search';
import { FeedCard } from '@/components/FeedCard';
import { FeedSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/AppLayout';

const SUGGESTIONS = [
  'tech conferences in Delhi',
  'free online workshops',
  'fitness products under 1000',
  'startup networking events',
  'photography courses',
  'sustainable products',
];

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'event', label: 'Events only' },
  { value: 'product', label: 'Products only' },
];

export default function SearchPage() {
  const { query, results, total, isLoading, hasSearched, filter, setQuery, setFilter, search, toggleInteraction } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(query);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (q?: string) => {
    const finalQ = q ?? inputValue;
    setQuery(finalQ);
    setInputValue(finalQ);
    // Slight delay to let state settle
    setTimeout(() => search(true), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setQuery(inputValue);
      setTimeout(() => search(true), 0);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <AppLayout>
      {/* Search hero */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full px-4 py-1.5 text-sm font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Semantic Search
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Find anything in natural language
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Try "tech events next month" or "affordable fitness gadgets"
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search events and products…"
            className="w-full pl-11 pr-24 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm text-base"
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-24 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Button
            onClick={() => handleSearch()}
            isLoading={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 !py-2"
            size="sm"
          >
            Search
          </Button>
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter({ type: f.value || undefined });
                if (query) setTimeout(() => search(true), 0);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                (filter.type ?? '') === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Suggestions (when no query) */}
        {!hasSearched && !isLoading && (
          <div className="mt-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Try searching for…</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 dark:text-gray-400 rounded-lg text-sm transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading && results.length === 0 ? (
        <FeedSkeleton count={6} />
      ) : hasSearched && results.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">No results for "{query}"</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try different keywords or a broader search</p>
        </motion.div>
      ) : results.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{total}</span> results for{' '}
              <span className="font-medium text-primary-600">"{query}"</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((item, idx) => (
              <FeedCard
                key={item.id}
                item={item}
                index={idx}
                onLike={() => toggleInteraction(item.id, item.item_type, 'like')}
                onSave={() => toggleInteraction(item.id, item.item_type, 'save')}
              />
            ))}
          </div>
        </>
      ) : null}
    </AppLayout>
  );
}
