import { create } from 'zustand';
import type { WorkoutTemplate, TemplateMovement, Accessory } from '../types';
import { supabase } from '../lib/supabase';

interface TemplateStore {
  templates: WorkoutTemplate[];
  loadUserTemplates: (userId: string) => Promise<void>;
  clearTemplates: () => void;
  addTemplate: (name: string, movements: TemplateMovement[], accessories?: Accessory[]) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateStore>()((set, get) => ({
  templates: [],

  loadUserTemplates: async (userId) => {
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
      createdAt: row.created_at,
    }));

    set({ templates });
  },

  clearTemplates: () => set({ templates: [] }),

  addTemplate: async (name, movements, accessories = []) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic update — show immediately
    const optimistic: WorkoutTemplate = {
      id: crypto.randomUUID(),
      name,
      movements,
      accessories,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ templates: [...state.templates, optimistic] }));

    const { data, error } = await supabase
      .from('templates')
      .insert({ user_id: user.id, name, movements, accessories })
      .select()
      .single();

    if (error) { console.error('addTemplate error:', error); return; }
    if (!data) return;

    // Replace optimistic entry with real Supabase record
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === optimistic.id
          ? { id: data.id, name: data.name, movements: data.movements, accessories: data.accessories ?? [], createdAt: data.created_at }
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

    await supabase.from('templates').update(payload).eq('id', id).eq('user_id', user.id);

    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  deleteTemplate: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('templates').delete().eq('id', id).eq('user_id', user.id);

    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
  },
}));
