import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchFeed } from '../lib/feedService';
import type { FeedEntry } from '../lib/feedService';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface FeedStore {
  feed: FeedEntry[];
  cachedUserId: string | null;
  lastFetched: number | null;
  loading: boolean;
  loadFeed: (userId: string, force?: boolean) => Promise<void>;
  removeFeedItem: (sessionId: string) => void;
}

export const useFeedStore = create<FeedStore>()(persist((set, get) => ({
  feed: [],
  cachedUserId: null,
  lastFetched: null,
  loading: false,

  loadFeed: async (userId, force = false) => {
    const { cachedUserId, lastFetched } = get();

    if (cachedUserId !== userId) {
      set({ feed: [], cachedUserId: null, lastFetched: null });
    } else if (!force && lastFetched && Date.now() - lastFetched < CACHE_TTL_MS) {
      return;
    }

    set({ loading: true });
    const items = await fetchFeed();
    set({ feed: items, loading: false, cachedUserId: userId, lastFetched: Date.now() });
  },

  removeFeedItem: (sessionId) => {
    set((state) => ({ feed: state.feed.filter((item) => item.sessionId !== sessionId) }));
  },
}), {
  name: 'ironlog-feed',
  partialize: (s) => ({ feed: s.feed, cachedUserId: s.cachedUserId, lastFetched: s.lastFetched }),
}));
