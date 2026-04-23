import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutTemplate, TemplateMovement } from '../types';

interface TemplateStore {
  templates: WorkoutTemplate[];
  addTemplate: (name: string, movements: TemplateMovement[]) => void;
  updateTemplate: (id: string, updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set) => ({
      templates: [],

      addTemplate: (name, movements) =>
        set((state) => ({
          templates: [
            ...state.templates,
            {
              id: crypto.randomUUID(),
              name,
              movements,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'ironlog-templates',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { templates?: unknown[] };
        if (version === 0 && Array.isArray(state.templates)) {
          return {
            ...state,
            templates: state.templates.map((t: unknown) => {
              const tmpl = t as Record<string, unknown>;
              const movs = tmpl.movements as unknown[];
              if (Array.isArray(movs) && movs.length > 0 && typeof movs[0] === 'string') {
                return {
                  ...tmpl,
                  movements: (movs as string[]).map((m) => ({
                    id: crypto.randomUUID(),
                    name: m,
                    targetSets: Number(tmpl.targetSets) || 3,
                    targetReps: m === 'deadlift' ? 3 : 5,
                  })),
                };
              }
              return tmpl;
            }),
          };
        }
        return persisted;
      },
    }
  )
);
