import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useProfileStore } from '../store/useProfileStore';
import { useAuthStore } from '../store/useAuthStore';
import { useState, useEffect } from 'react';

export function Profile() {
  const { profile, updateProfile } = useProfileStore();
  const signOut = useAuthStore((s) => s.signOut);

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setUsername(profile.username);
    }
  }, [profile?.id]);

  const handleSave = async () => {
    setError(null);
    const err = await updateProfile({
      displayName: displayName.trim(),
      username: username.trim(),
    });
    if (err) { setError(err); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!profile) return null;

  return (
    <div className="page">
      <Header title="Profile" />
      <div className="page-content">
        <Card className="profile-card">
          <div className="profile-avatar">
            {profile.displayName[0]?.toUpperCase() ?? '?'}
          </div>
          <Input
            label="Username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(null); }}
          />
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <div className="input-group">
            <span className="input-label">Weight Unit</span>
            <div className="unit-toggle">
              <button
                className={`unit-btn ${profile.unit === 'kg' ? 'unit-btn--active' : ''}`}
                onClick={() => updateProfile({ unit: 'kg' })}
              >
                kg
              </button>
              <button
                className={`unit-btn ${profile.unit === 'lb' ? 'unit-btn--active' : ''}`}
                onClick={() => updateProfile({ unit: 'lb' })}
              >
                lb
              </button>
            </div>
          </div>

          <div className="input-group">
            <span className="input-label">Privacy</span>
            <label className="toggle-row">
              <span>Public Profile</span>
              <input
                type="checkbox"
                checked={profile.privacyPublic}
                onChange={(e) => updateProfile({ privacyPublic: e.target.checked })}
                className="toggle-input"
              />
            </label>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <Button variant="primary" fullWidth onClick={handleSave}>
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
          <Button variant="ghost" fullWidth onClick={signOut}>
            Log Out
          </Button>
        </Card>
      </div>
    </div>
  );
}
