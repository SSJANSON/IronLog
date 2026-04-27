import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Friend } from '../types';

export interface SearchResult {
  id: string;
  username: string;
  displayName: string;
}

interface FriendStore {
  friends: Friend[];
  loadFriends: () => Promise<void>;
  clearFriends: () => void;
  searchUsers: (username: string) => Promise<SearchResult[]>;
  sendFriendRequest: (friendId: string) => Promise<void>;
  acceptFriendRequest: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

export const useFriendStore = create<FriendStore>()((set, get) => ({
  friends: [],

  loadFriends: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        profiles!friends_friend_id_fkey (username, display_name),
        sender:profiles!friends_user_id_fkey (username, display_name)
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error || !data) return;

    const friends: Friend[] = data.map((row) => {
      const isSender = row.user_id === user.id;
      const profile = isSender
        ? (row.profiles as { username: string; display_name: string } | null)
        : (row.sender as { username: string; display_name: string } | null);
      const otherId = isSender ? row.friend_id : row.user_id;

      return {
        id: otherId,
        username: profile?.username ?? '',
        displayName: profile?.display_name ?? '',
        status: row.status as 'pending' | 'accepted',
        privacyPublic: true,
      };
    });

    set({ friends });
  },

  clearFriends: () => set({ friends: [] }),

  searchUsers: async (username) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .ilike('username', `%${username}%`)
      .neq('id', user.id)
      .limit(10);

    if (error || !data) return [];

    return data.map((p) => ({
      id: p.id,
      username: p.username,
      displayName: p.display_name,
    }));
  },

  sendFriendRequest: async (friendId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('friends').insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending',
    });

    await get().loadFriends();
  },

  acceptFriendRequest: async (friendId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('user_id', friendId)
      .eq('friend_id', user.id);

    await get().loadFriends();
  },

  removeFriend: async (friendId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('friends')
      .delete()
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
      );

    set((state) => ({ friends: state.friends.filter((f) => f.id !== friendId) }));
  },
}));
