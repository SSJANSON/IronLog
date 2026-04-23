import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Templates } from './pages/Templates';
import { Session } from './pages/Session';
import { Progress } from './pages/Progress';
import { Social } from './pages/Social';
import { Profile } from './pages/Profile';
import { Calendar } from './pages/Calendar';
import { WorkoutComplete } from './pages/WorkoutComplete';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/complete" element={<WorkoutComplete />} />
        <Route
          path="*"
          element={
            <AppShell>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/session" element={<Session />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/social" element={<Social />} />
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
