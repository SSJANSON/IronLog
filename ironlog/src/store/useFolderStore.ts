import { create } from 'zustand';
import type { TemplateFolder } from '../types';
import { supabase } from '../lib/supabase';

interface FolderStore {
  folders: TemplateFolder[];
  loadFolders: () => Promise<void>;
  clearFolders: () => void;
  addFolder: (name: string, parentId: string | null) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  moveFolder: (id: string, newParentId: string | null) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

export const useFolderStore = create<FolderStore>()((set) => ({
  folders: [],

  loadFolders: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('template_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error || !data) return;
    set({
      folders: data.map((row) => ({
        id: row.id,
        name: row.name,
        parentId: row.parent_id ?? null,
        createdAt: row.created_at,
      })),
    });
  },

  clearFolders: () => set({ folders: [] }),

  addFolder: async (name, parentId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const optimistic: TemplateFolder = {
      id: crypto.randomUUID(),
      name,
      parentId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ folders: [...state.folders, optimistic] }));
    const { data, error } = await supabase
      .from('template_folders')
      .insert({ user_id: user.id, name, parent_id: parentId })
      .select()
      .single();
    if (error) { console.error('addFolder error:', error); return; }
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === optimistic.id
          ? { id: data.id, name: data.name, parentId: data.parent_id ?? null, createdAt: data.created_at }
          : f
      ),
    }));
  },

  renameFolder: async (id, name) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('template_folders').update({ name }).eq('id', id).eq('user_id', user.id);
    set((state) => ({
      folders: state.folders.map((f) => f.id === id ? { ...f, name } : f),
    }));
  },

  moveFolder: async (id, newParentId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('template_folders').update({ parent_id: newParentId }).eq('id', id).eq('user_id', user.id);
    set((state) => ({
      folders: state.folders.map((f) => f.id === id ? { ...f, parentId: newParentId } : f),
    }));
  },

  deleteFolder: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('template_folders').delete().eq('id', id).eq('user_id', user.id);
    set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
  },
}));
