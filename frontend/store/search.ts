import { create } from 'zustand';
import { searchApi, interactionApi } from '@/lib/api';
import type { FeedItem } from './feed';

interface SearchState {
  query: string;
  results: FeedItem[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  hasSearched: boolean;
  filter: { type?: string };
  setQuery: (q: string) => void;
  setFilter: (f: Partial<SearchState['filter']>) => void;
  search: (reset?: boolean) => Promise<void>;
  toggleInteraction: (itemId: string, itemType: 'event' | 'product', interactionType: 'like' | 'save') => Promise<void>;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  total: 0,
  page: 1,
  limit: 12,
  isLoading: false,
  hasSearched: false,
  filter: {},

  setQuery: (q) => set({ query: q }),
  setFilter: (f) => set((s) => ({ filter: { ...s.filter, ...f }, page: 1, results: [], hasSearched: false })),

  search: async (reset = true) => {
    const { query, page, limit, filter, isLoading } = get();
    if (!query.trim() || isLoading) return;

    const currentPage = reset ? 1 : page;
    set({ isLoading: true });

    try {
      const res = await searchApi.search({ q: query, page: currentPage, limit, ...filter });
      const { items, total } = res.data.data;

      set((s) => ({
        results: reset ? items : [...s.results, ...items],
        total,
        page: currentPage + 1,
        isLoading: false,
        hasSearched: true,
      }));
    } catch {
      set({ isLoading: false, hasSearched: true });
    }
  },

  toggleInteraction: async (itemId, itemType, interactionType) => {
    const { results } = get();
    const item = results.find((i) => i.id === itemId);
    if (!item) return;

    const wasActive = interactionType === 'like' ? item.is_liked : item.is_saved;
    const countField = interactionType === 'like' ? 'likes_count' : 'saves_count';
    const activeField = interactionType === 'like' ? 'is_liked' : 'is_saved';

    set((s) => ({
      results: s.results.map((i) =>
        i.id === itemId
          ? { ...i, [activeField]: !wasActive, [countField]: wasActive ? i[countField] - 1 : i[countField] + 1 }
          : i
      ),
    }));

    try {
      await interactionApi.toggle({ item_type: itemType, item_id: itemId, interaction_type: interactionType });
    } catch {
      set((s) => ({
        results: s.results.map((i) =>
          i.id === itemId ? { ...i, [activeField]: wasActive, [countField]: item[countField] } : i
        ),
      }));
    }
  },
}));
