import { create } from 'zustand';
import { fetchFeed } from '../lib/feedService';
import type { FeedEntry } from '../lib/feedService';

interface FeedStore {
  feed: FeedEntry[];
  loading: boolean;
  loadFeed: () => Promise<void>;
  removeFeedItem: (sessionId: string) => void;
}

export const useFeedStore = create<FeedStore>((set) => ({
  feed: [],
  loading: true,

  loadFeed: async () => {
    set({ loading: true });
    const items = await fetchFeed();
    set({ feed: items, loading: false });
  },

  removeFeedItem: (sessionId) => {
    set((state) => ({ feed: state.feed.filter((item) => item.sessionId !== sessionId) }));
  },
}));
