import { create } from 'zustand';
import { feedApi, interactionApi } from '@/lib/api';

export interface FeedItem {
  id: string;
  item_type: 'event' | 'product';
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  image_url: string | null;
  price: number;
  likes_count: number;
  saves_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  is_registered?: boolean;
  org_id: string;
  org_name: string;
  org_logo: string | null;
  created_at: string;
  // event-specific
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  is_virtual?: boolean;
  registered_count?: number;
  capacity?: number | null;
  status?: string;
  // product-specific
  stock?: number | null;
}

interface FeedState {
  items: FeedItem[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  hasMore: boolean;
  filter: { type?: string; category?: string; sort?: string };
  fetchFeed: (reset?: boolean) => Promise<void>;
  setFilter: (f: Partial<FeedState['filter']>) => void;
  toggleInteraction: (itemId: string, itemType: 'event' | 'product', interactionType: 'like' | 'save') => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  limit: 12,
  isLoading: false,
  hasMore: true,
  filter: {},

  setFilter: (f) => set((s) => ({ filter: { ...s.filter, ...f }, page: 1, items: [], hasMore: true })),

  fetchFeed: async (reset = false) => {
    const { page, limit, filter, isLoading } = get();
    if (isLoading) return;

    const currentPage = reset ? 1 : page;
    set({ isLoading: true });

    try {
      const res = await feedApi.get({ page: currentPage, limit, ...filter });
      const { items, total } = res.data.data;

      set((s) => ({
        items: reset ? items : [...s.items, ...items],
        total,
        page: currentPage + 1,
        hasMore: (reset ? items : [...s.items, ...items]).length < total,
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  toggleInteraction: async (itemId, itemType, interactionType) => {
    const { items } = get();
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const wasActive = interactionType === 'like' ? item.is_liked : item.is_saved;
    const countField = interactionType === 'like' ? 'likes_count' : 'saves_count';
    const activeField = interactionType === 'like' ? 'is_liked' : 'is_saved';

    // Optimistic update
    set((s) => ({
      items: s.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              [activeField]: !wasActive,
              [countField]: wasActive ? i[countField] - 1 : i[countField] + 1,
            }
          : i
      ),
    }));

    try {
      await interactionApi.toggle({ item_type: itemType, item_id: itemId, interaction_type: interactionType });
    } catch {
      // Revert on error
      set((s) => ({
        items: s.items.map((i) =>
          i.id === itemId
            ? {
                ...i,
                [activeField]: wasActive,
                [countField]: item[countField],
              }
            : i
        ),
      }));
    }
  },
}));
