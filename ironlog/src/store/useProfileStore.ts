import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../types';

interface ProfileStore {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const defaultProfile: UserProfile = {
  id: crypto.randomUUID(),
  username: 'athlete',
  displayName: 'Athlete',
  unit: 'kg',
  privacyPublic: true,
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      updateProfile: (updates) =>
        set((state) => ({ profile: { ...state.profile, ...updates } })),
    }),
    { name: 'ironlog-profile' }
  )
);
