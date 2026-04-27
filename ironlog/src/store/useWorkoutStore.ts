import { create } from 'zustand';
import type { WorkoutSession, Set, TemplateMovement, PRMap } from '../types';
import { buildPRMap } from '../lib/prDetection';
import { supabase } from '../lib/supabase';

interface WorkoutStore {
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  prs: PRMap;
  loadUserSessions: (userId: string) => Promise<void>;
  clearSessions: () => void;
  startSession: (templateId: string, templateName: string, movements: TemplateMovement[], date?: string) => void;
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

export const useWorkoutStore = create<WorkoutStore>()((set, get) => ({
  sessions: [],
  activeSession: null,
  prs: { squat: null, bench: null, deadlift: null },

  loadUserSessions: async (userId) => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
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

    set({ sessions, prs: buildPRMap(sessions) });
  },

  clearSessions: () => {
    set({ sessions: [], activeSession: null, prs: { squat: null, bench: null, deadlift: null } });
  },

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

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('sessions').update({
        template_name: session.templateName,
        date: session.date,
        movements: session.movements,
      }).eq('id', session.id).eq('user_id', user.id);
    });
  },

  deleteSession: (id) => {
    const newSessions = get().sessions.filter((s) => s.id !== id);
    set({ sessions: newSessions, prs: buildPRMap(newSessions) });

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('sessions').delete().eq('id', id).eq('user_id', user.id);
    });
  },
}));
