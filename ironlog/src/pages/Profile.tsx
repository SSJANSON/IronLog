import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useProfileStore } from '../store/useProfileStore';
import { useState } from 'react';

export function Profile() {
  const { profile, updateProfile } = useProfileStore();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile({ displayName: displayName.trim(), username: username.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page">
      <Header title="Profile" />
      <div className="page-content">
        <Card className="profile-card">
          <div className="profile-avatar">
            {profile.displayName[0].toUpperCase()}
          </div>
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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

          <Button variant="primary" fullWidth onClick={handleSave}>
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
