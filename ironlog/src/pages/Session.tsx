import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Header } from '../components/layout/Header';
import { SetLogger } from '../components/session/SetLogger';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useTemplateStore } from '../store/useTemplateStore';
import { useSessionDraft } from '../hooks/useSessionDraft';
import type { TemplateMovement } from '../types';

const OTHER_MOVEMENTS: TemplateMovement[] = [
  { id: 'squat', name: 'squat', targetSets: 3, targetReps: 5 },
  { id: 'bench', name: 'bench', targetSets: 3, targetReps: 5 },
  { id: 'deadlift', name: 'deadlift', targetSets: 3, targetReps: 3 },
];

export function Session() {
  const navigate = useNavigate();
  const { activeSession } = useSessionDraft();
  const discardSession = useWorkoutStore((s) => s.discardSession);
  const startSession = useWorkoutStore((s) => s.startSession);
  const updateSessionDate = useWorkoutStore((s) => s.updateSessionDate);
  const updateSessionName = useWorkoutStore((s) => s.updateSessionName);
  const templates = useTemplateStore((s) => s.templates);

  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? 'other');
  const [sessionName, setSessionName] = useState('');

  const selectedTemplate = templates.find((t) => t.id === selectedId);
  const namePlaceholder = selectedId === 'other' ? 'e.g. Morning lift' : (selectedTemplate?.name ?? '');

  const handleStart = () => {
    const isOther = selectedId === 'other';
    const template = selectedTemplate;
    const name = sessionName.trim() || (isOther ? 'Other' : (template?.name ?? 'Session'));
    const movements = isOther ? OTHER_MOVEMENTS : (template?.movements ?? []);
    const accessories = isOther ? [] : (template?.accessories ?? []);
    startSession(selectedId, name, movements, accessories);
  };

  if (!activeSession) {
    return (
      <div className="page">
        <Header title="Log Session" />
        <div className="page-content">
          <div className="session-start-form">
            <div className="input-group">
              <label className="input-label" htmlFor="template-select">Workout</label>
              <select
                id="template-select"
                className="input"
                value={selectedId}
                onChange={(e) => { setSelectedId(e.target.value); setSessionName(''); }}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value="other">Other…</option>
              </select>
            </div>

            <Input
              label="Session Name"
              placeholder={namePlaceholder}
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              hint="Leave blank to use the workout name"
            />

            <Button variant="primary" fullWidth onClick={handleStart}>
              Start Session
            </Button>

            {templates.length === 0 && selectedId !== 'other' && (
              <p className="session-start-hint">
                No templates yet.{' '}
                <button className="link-btn" onClick={() => navigate('/templates')}>
                  Create one
                </button>{' '}
                or choose Other.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const sessionDateValue = format(new Date(activeSession.date), 'yyyy-MM-dd');

  return (
    <div className="page">
      <Header title={activeSession.templateName} showBack={false} />
      <div className="page-content">
        <div className="session-meta-row">
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label" htmlFor="session-name">Session Name</label>
            <input
              id="session-name"
              type="text"
              className="input"
              value={activeSession.templateName}
              onChange={(e) => updateSessionName(e.target.value)}
              placeholder="Session name"
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="session-date">Date</label>
            <input
              id="session-date"
              type="date"
              className="input session-date-input"
              value={sessionDateValue}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  updateSessionDate(new Date(y, m - 1, d).toISOString());
                }
              }}
            />
          </div>
        </div>
        <SetLogger
          session={activeSession}
          onComplete={() => navigate('/')}
          onDiscard={() => {
            discardSession();
            navigate('/');
          }}
        />
      </div>
    </div>
  );
}
