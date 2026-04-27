import { supabase } from './supabase';
import type { WorkoutSession, PersonalRecord, MovementLog } from '../types';

export interface FeedEntry {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  sessionName: string;
  movementCount: number;
  movements: MovementLog[];
  prs: PersonalRecord[];
  createdAt: string;
}

export async function postSessionToFeed(
  userId: string,
  session: WorkoutSession,
  newPRs: PersonalRecord[]
): Promise<void> {
  const activeMovements = session.movements.filter((m) => m.sets.length > 0);
  const movementCount = activeMovements.length;
  const movements = activeMovements;

  const { error } = await supabase.from('feed_items').insert({
    user_id: userId,
    type: 'session',
    session_id: session.id,
    session_name: session.templateName,
    movement_count: movementCount,
    movements,
    prs: newPRs,
  });

  if (error) console.error('postSessionToFeed error:', error);
}

export async function fetchFeed(): Promise<FeedEntry[]> {
  // Fetch feed items
  const { data, error } = await supabase
    .from('feed_items')
    .select('id, user_id, session_name, movement_count, movements, prs, created_at')
    .eq('type', 'session')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) { console.error('fetchFeed error:', error); return []; }
  if (!data || data.length === 0) return [];

  // Fetch profiles for all unique user_ids
  const userIds = [...new Set(data.map((item) => item.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('id', userIds);

  if (profilesError) console.error('fetchFeed profiles error:', profilesError);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return data.map((item) => {
    const profile = profileMap.get(item.user_id);
    return {
      id: item.id,
      userId: item.user_id,
      username: profile?.username ?? '',
      displayName: profile?.display_name ?? '',
      sessionName: item.session_name ?? '',
      movementCount: item.movement_count ?? 0,
      movements: (item.movements as MovementLog[]) ?? [],
      prs: (item.prs as PersonalRecord[]) ?? [],
      createdAt: item.created_at,
    };
  });
}
