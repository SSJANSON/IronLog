import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';

const DRAFT_KEY = 'ironlog-session-draft';
const AUTO_SAVE_INTERVAL = 10_000;

export function useSessionDraft() {
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeSession) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(activeSession));
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeSession]);

  return { activeSession };
}
