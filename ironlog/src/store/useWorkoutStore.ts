import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutSession, Set, TemplateMovement, Accessory, PRMap } from '../types';
import { buildPRMap } from '../lib/prDetection';
import { supabase } from '../lib/supabase';
import { useFeedStore } from './useFeedStore';

interface WorkoutStore {
  sessions: WorkoutSession[];
  cachedUserId: string | null;
  activeSession: WorkoutSession | null;
  prs: PRMap;
  loadUserSessions: (userId: string) => Promise<void>;
  clearSessions: () => void;
  startSession: (templateId: string, templateName: string, movements: TemplateMovement[], accessories?: Accessory[], date?: string) => void;
  logSet: (movement: string, set: Omit<Set, 'id'>) => void;
  removeSet: (movement: string, setId: string) => void;
  completeSession: () => WorkoutSession | null;
  saveSessionToSupabase: (session: WorkoutSession) => Promise<void>;
  discardSession: () => void;
  deleteSession: (id: string) => void;
  updateSessionDate: (date: string) => void;
  updateSessionName: (name: string) => void;
  updateSession: (session: WorkoutSession) => void;
}

const DRAFT_KEY = 'ironlog-session-draft';
const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

function threeMonthsCutoff() {
  return new Date(Date.now() - THREE_MONTHS_MS).toISOString().split('T')[0];
}

export const useWorkoutStore = create<WorkoutStore>()(persist((set, get) => ({
  sessions: [],
  cachedUserId: null,
  activeSession: null,
  prs: { squat: null, bench: null, deadlift: null },

  loadUserSessions: async (userId) => {
    if (get().cachedUserId !== userId) set({ sessions: [], cachedUserId: null });

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('date', threeMonthsCutoff())
      .order('date', { ascending: false });

    if (error || !data) return;

    const sessions: WorkoutSession[] = data.map((row) => ({
      id: row.id,
      date: row.date,
      templateId: row.template_id ?? '',
      templateName: row.template_name,
      completed: row.completed,
      movements: row.movements ?? [],
    }));

    set({ sessions, cachedUserId: userId, prs: buildPRMap(sessions) });
  },

  clearSessions: () => {
    set({ sessions: [], cachedUserId: null, activeSession: null, prs: { squat: null, bench: null, deadlift: null } });
  },

  startSession: (templateId, templateName, movements, accessories, date) => {
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      date: date ?? new Date().toISOString(),
      templateId,
      templateName,
      completed: false,
      movements: [
        ...movements.map((m) => ({ movement: m.name, variation: m.variation, sets: [] })),
        ...(accessories ?? []).map((a) => ({ movement: a.name, sets: [] })),
      ],
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
            ? { ...log, sets: [...log.sets, { ...setData, id: crypto.randomUUID() }] }
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

  saveSessionToSupabase: async (session: WorkoutSession) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('sessions').insert({
      id: session.id,
      user_id: user.id,
      template_id: session.templateId || null,
      template_name: session.templateName,
      date: session.date,
      completed: true,
      movements: session.movements,
    });
    if (error) console.error('saveSession error:', error);
  },

  discardSession: () => {
    set({ activeSession: null });
    localStorage.removeItem(DRAFT_KEY);
  },

  updateSessionName: (name) =>
    set((state) => {
      if (!state.activeSession) return state;
      const updated = { ...state.activeSession, templateName: name };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
      return { activeSession: updated };
    }),

  updateSessionDate: (date) =>
    set((state) => {
      if (!state.activeSession) return state;
      const updated = { ...state.activeSession, date };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
      return { activeSession: updated };
    }),

  updateSession: (session) => {
    const newSessions = get().sessions.map((s) => s.id === session.id ? session : s);
    set({ sessions: newSessions, prs: buildPRMap(newSessions) });

    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      await supabase.from('sessions').update({
        template_name: session.templateName,
        date: session.date,
        movements: session.movements,
      }).eq('id', session.id).eq('user_id', user.id);
    });
  },

  deleteSession: (id) => {
    const newSessions = get().sessions.filter((s) => s.id !== id);
    set({ sessions: newSessions, prs: buildPRMap(newSessions) });
    useFeedStore.getState().removeFeedItem(id);

    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      await supabase.from('sessions').delete().eq('id', id).eq('user_id', user.id);
    });
  },
}), {
  name: 'ironlog-sessions',
  partialize: (s) => ({ sessions: s.sessions, cachedUserId: s.cachedUserId }),
  onRehydrateStorage: () => (state) => {
    if (state?.sessions?.length) {
      state.prs = buildPRMap(state.sessions);
    }
  },
}));
