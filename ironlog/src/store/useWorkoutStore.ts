import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutSession, Set, TemplateMovement, PRMap } from '../types';
import { buildPRMap } from '../lib/prDetection';

interface WorkoutStore {
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  prs: PRMap;
  startSession: (templateId: string, templateName: string, movements: TemplateMovement[], date?: string) => void;
  logSet: (movement: string, set: Omit<Set, 'id'>) => void;
  removeSet: (movement: string, setId: string) => void;
  completeSession: () => WorkoutSession | null;
  discardSession: () => void;
  deleteSession: (id: string) => void;
  updateSessionDate: (date: string) => void;
  updateSessionName: (name: string) => void;
  updateSession: (session: WorkoutSession) => void;
}

const DRAFT_KEY = 'ironlog-session-draft';

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,
      prs: { squat: null, bench: null, deadlift: null },

      startSession: (templateId, templateName, movements, date) => {
        const session: WorkoutSession = {
          id: crypto.randomUUID(),
          date: date ?? new Date().toISOString(),
          templateId,
          templateName,
          completed: false,
          movements: movements.map((m) => ({ movement: m.name, sets: [] })),
        };
        set({ activeSession: session });
        localStorage.setItem(DRAFT_KEY, JSON.stringify(session));
      },

      logSet: (movement, setData) =>
        set((state) => {
          if (!state.activeSession) return state;
          const updated: WorkoutSession = {
            ...state.activeSession,
            movements: state.activeSession.movements.map((log) =>
              log.movement === movement
                ? {
                    ...log,
                    sets: [...log.sets, { ...setData, id: crypto.randomUUID() }],
                  }
                : log
            ),
          };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
          return { activeSession: updated };
        }),

      removeSet: (movement, setId) =>
        set((state) => {
          if (!state.activeSession) return state;
          const updated: WorkoutSession = {
            ...state.activeSession,
            movements: state.activeSession.movements.map((log) =>
              log.movement === movement
                ? { ...log, sets: log.sets.filter((s) => s.id !== setId) }
                : log
            ),
          };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
          return { activeSession: updated };
        }),

      completeSession: () => {
        const { activeSession, sessions } = get();
        if (!activeSession) return null;

        const completed: WorkoutSession = { ...activeSession, completed: true };
        const newSessions = [...sessions, completed];
        const newPRs = buildPRMap(newSessions);

        set({ sessions: newSessions, activeSession: null, prs: newPRs });
        localStorage.removeItem(DRAFT_KEY);
        return completed;
      },

      discardSession: () => {
        set({ activeSession: null });
        localStorage.removeItem(DRAFT_KEY);
      },

      updateSessionName: (name) => {
        set((state) => {
          if (!state.activeSession) return state;
          const updated = { ...state.activeSession, templateName: name };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
          return { activeSession: updated };
        });
      },

      updateSessionDate: (date) => {
        set((state) => {
          if (!state.activeSession) return state;
          const updated = { ...state.activeSession, date };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
          return { activeSession: updated };
        });
      },

      updateSession: (session) => {
        const newSessions = get().sessions.map((s) => s.id === session.id ? session : s);
        set({ sessions: newSessions, prs: buildPRMap(newSessions) });
      },

      deleteSession: (id) => {
        const newSessions = get().sessions.filter((s) => s.id !== id);
        set({ sessions: newSessions, prs: buildPRMap(newSessions) });
      },
    }),
    { name: 'ironlog-workouts' }
  )
);
