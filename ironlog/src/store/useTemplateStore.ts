import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutTemplate, TemplateMovement, Accessory } from '../types';
import { supabase } from '../lib/supabase';

interface TemplateStore {
  templates: WorkoutTemplate[];
  cachedUserId: string | null;
  loadUserTemplates: (userId: string) => Promise<void>;
  clearTemplates: () => void;
  addTemplate: (name: string, movements: TemplateMovement[], accessories?: Accessory[], folderId?: string | null) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt'>>) => Promise<void>;
  moveTemplate: (id: string, folderId: string | null) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateStore>()(persist((set, get) => ({
  templates: [],
  cachedUserId: null,

  loadUserTemplates: async (userId) => {
    if (get().cachedUserId !== userId) set({ templates: [], cachedUserId: null });

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data) return;

    const templates: WorkoutTemplate[] = data.map((row) => ({
      id: row.id,
      name: row.name,
      movements: row.movements ?? [],
      accessories: row.accessories ?? [],
      folderId: row.folder_id ?? null,
      createdAt: row.created_at,
    }));

    set({ templates, cachedUserId: userId });
  },

  clearTemplates: () => set({ templates: [], cachedUserId: null }),

  addTemplate: async (name, movements, accessories = [], folderId = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const optimistic: WorkoutTemplate = {
      id: crypto.randomUUID(),
      name,
      movements,
      accessories,
      folderId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ templates: [...state.templates, optimistic] }));

    const { data, error } = await supabase
      .from('templates')
      .insert({ user_id: user.id, name, movements, accessories, folder_id: folderId })
      .select()
      .single();

    if (error) { console.error('addTemplate error:', error); return; }
    if (!data) return;

    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === optimistic.id
          ? { id: data.id, name: data.name, movements: data.movements, accessories: data.accessories ?? [], folderId: data.folder_id ?? null, createdAt: data.created_at }
          : t
      ),
    }));
  },

  updateTemplate: async (id, updates) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.movements !== undefined) payload.movements = updates.movements;
    if (updates.accessories !== undefined) payload.accessories = updates.accessories;
    if ('folderId' in updates) payload.folder_id = updates.folderId ?? null;

    await supabase.from('templates').update(payload).eq('id', id).eq('user_id', user.id);

    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  moveTemplate: async (id, folderId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('templates').update({ folder_id: folderId }).eq('id', id).eq('user_id', user.id);
    set((state) => ({
      templates: state.templates.map((t) => t.id === id ? { ...t, folderId } : t),
    }));
  },

  deleteTemplate: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('templates').delete().eq('id', id).eq('user_id', user.id);

    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
  },
}), { name: 'ironlog-templates', partialize: (s) => ({ templates: s.templates, cachedUserId: s.cachedUserId }) }));
