import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Home } from './pages/Home';
import { Templates } from './pages/Templates';
import { Session } from './pages/Session';
import { Progress } from './pages/Progress';
import { You } from './pages/You';
import { Profile } from './pages/Profile';
import { Calendar } from './pages/Calendar';
import { WorkoutComplete } from './pages/WorkoutComplete';
import { Auth } from './pages/Auth';
import { useAuthStore } from './store/useAuthStore';
import { supabase } from './lib/supabase';
import { useWorkoutStore } from './store/useWorkoutStore';
import { useTemplateStore } from './store/useTemplateStore';
import { useFolderStore } from './store/useFolderStore';
import { useFriendStore } from './store/useFriendStore';
import { useProfileStore } from './store/useProfileStore';

export default function App() {
  const { user, loading, init } = useAuthStore();
  const { loadUserSessions, clearSessions } = useWorkoutStore();
  const { loadUserTemplates, clearTemplates } = useTemplateStore();
  const { loadFolders, clearFolders } = useFolderStore();
  const { loadFriends, clearFriends } = useFriendStore();
  const { loadProfile, clearProfile } = useProfileStore();

  useEffect(() => {
    const unsub = init();
    return unsub;
  }, []);

  useEffect(() => {
    if (user) {
      // Ensure profile row exists before loading user data
      supabase.from('profiles').upsert({
        id: user.id,
        username: user.user_metadata?.username ?? user.email?.split('@')[0] ?? user.id,
        display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'User',
      }, { onConflict: 'id', ignoreDuplicates: true }).then(({ error }) => {
        if (error) console.error('Profile upsert error:', error);
        loadProfile(user.id);
        loadUserSessions(user.id);
        loadUserTemplates(user.id);
        loadFolders();
        loadFriends();
      });
    } else {
      clearSessions();
      clearTemplates();
      clearFolders();
      clearFriends();
      clearProfile();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/complete" element={<WorkoutComplete />} />
        <Route
          path="*"
          element={
            <AppShell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/session" element={<Session />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/you" element={<You />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
