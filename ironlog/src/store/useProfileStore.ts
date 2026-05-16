import { create } from 'zustand';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface ProfileStore {
  profile: UserProfile | null;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id'>>) => Promise<string | null>;
  uploadAvatar: (file: File) => Promise<string | null>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,

  loadProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, unit, privacy_public, avatar_url')
      .eq('id', userId)
      .single();

    if (error || !data) { console.error('loadProfile error:', error); return; }

    set({
      profile: {
        id: data.id,
        username: data.username ?? '',
        displayName: data.display_name ?? '',
        unit: data.unit ?? 'kg',
        privacyPublic: data.privacy_public ?? true,
        avatarUrl: data.avatar_url ?? undefined,
      },
    });
  },

  updateProfile: async (updates) => {
    const current = get().profile;
    if (!current) return 'Not logged in';

    const dbUpdates: Record<string, unknown> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.privacyPublic !== undefined) dbUpdates.privacy_public = updates.privacyPublic;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', current.id);

    if (error) {
      if (error.code === '23505') return 'Username is already taken';
      return error.message;
    }

    set({ profile: { ...current, ...updates } });
    return null;
  },

  uploadAvatar: async (file) => {
    const current = get().profile;
    if (!current) return 'Not logged in';

    const ext = file.name.split('.').pop();
    const path = `${current.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) return uploadError.message;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', current.id);

    if (updateError) return updateError.message;

    set({ profile: { ...current, avatarUrl } });
    return null;
  },

  clearProfile: () => set({ profile: null }),
}));
