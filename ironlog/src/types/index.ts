export type Movement = 'squat' | 'bench' | 'deadlift';

export interface Set {
  id: string;
  weight: number;
  reps: number;
  rpe?: number;
  isBackdown?: boolean;
}

export interface MovementLog {
  movement: string;
  variation?: string;
  sets: Set[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  templateId: string;
  templateName: string;
  movements: MovementLog[];
  completed: boolean;
}

export interface BackdownGroup {
  sets: number;
  reps: number;
}

export const MOVEMENT_VARIATIONS: Record<string, string[]> = {
  squat:    ['competition', 'pause', 'tempo', 'custom'],
  bench:    ['competition', 'tempo', 'spoto', 'custom'],
  deadlift: ['competition', 'pause', 'rdl', 'custom'],
};

export interface TemplateMovement {
  id: string;
  name: string;
  variation?: string;
  targetSets: number;
  targetReps: number;
  backdownSets?: number;
  backdownReps?: number;
  backdownGroups?: BackdownGroup[];
}

export interface Accessory {
  id: string;
  name: string;
  sets: number;
  reps: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  movements: TemplateMovement[];
  accessories?: Accessory[];
  folderId?: string | null;
  createdAt: string;
}

export interface TemplateFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface PersonalRecord {
  movement: Movement;
  weight: number;
  reps: number;
  e1rm: number;
  date: string;
  sessionId: string;
}

export type PRMap = Record<Movement, PersonalRecord | null>;

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'pending' | 'accepted';
  direction: 'sent' | 'received';
  privacyPublic: boolean;
}

export interface FeedItem {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  type: 'pr' | 'session';
  movement?: Movement;
  weight?: number;
  reps?: number;
  e1rm?: number;
  sessionName?: string;
  date: string;
}

export type FilterRange = '4w' | '3m' | '6m' | '1y' | 'all';

export type RepRange = 'all' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  unit: 'kg' | 'lb';
  privacyPublic: boolean;
}
