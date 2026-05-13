import { useMemo } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useTemplateStore } from '../store/useTemplateStore';
import { MOVEMENT_VARIATIONS } from '../types';

export function useCustomVariations(): Record<string, string[]> {
  const sessions = useWorkoutStore((s) => s.sessions);
  const templates = useTemplateStore((s) => s.templates);

  return useMemo(() => {
    const custom: Record<string, Set<string>> = {};

    for (const movement of Object.keys(MOVEMENT_VARIATIONS)) {
      custom[movement] = new Set();
    }

    for (const template of templates) {
      for (const m of template.movements) {
        if (m.variation && !MOVEMENT_VARIATIONS[m.name]?.includes(m.variation)) {
          custom[m.name]?.add(m.variation);
        }
      }
    }

    for (const session of sessions) {
      for (const log of session.movements) {
        if (log.variation && MOVEMENT_VARIATIONS[log.movement] && !MOVEMENT_VARIATIONS[log.movement].includes(log.variation)) {
          custom[log.movement]?.add(log.variation);
        }
      }
    }

    return Object.fromEntries(
      Object.entries(custom).map(([k, v]) => [k, [...v]])
    );
  }, [sessions, templates]);
}
