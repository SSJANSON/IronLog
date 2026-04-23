import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Friend, FeedItem } from '../types';

interface SocialStore {
  friends: Friend[];
  feed: FeedItem[];
  sendFriendRequest: (username: string) => void;
  acceptFriendRequest: (id: string) => void;
  removeFriend: (id: string) => void;
  addFeedItem: (item: Omit<FeedItem, 'id'>) => void;
}

export const useSocialStore = create<SocialStore>()(
  persist(
    (set) => ({
      friends: [],
      feed: [],

      sendFriendRequest: (username) =>
        set((state) => ({
          friends: [
            ...state.friends,
            {
              id: crypto.randomUUID(),
              username,
              displayName: username,
              status: 'pending',
              privacyPublic: true,
            },
          ],
        })),

      acceptFriendRequest: (id) =>
        set((state) => ({
          friends: state.friends.map((f) =>
            f.id === id ? { ...f, status: 'accepted' } : f
          ),
        })),

      removeFriend: (id) =>
        set((state) => ({
          friends: state.friends.filter((f) => f.id !== id),
        })),

      addFeedItem: (item) =>
        set((state) => ({
          feed: [{ ...item, id: crypto.randomUUID() }, ...state.feed].slice(0, 100),
        })),
    }),
    { name: 'ironlog-social' }
  )
);
