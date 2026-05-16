import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useProfileStore } from '../store/useProfileStore';
import { useAuthStore } from '../store/useAuthStore';
import { useState, useEffect, useRef } from 'react';

export function Profile() {
  const { profile, updateProfile, uploadAvatar } = useProfileStore();
  const signOut = useAuthStore((s) => s.signOut);

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setUsername(profile.username);
    }
  }, [profile?.id]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setError(null);
    const err = await uploadAvatar(file);
    if (err) setError(err);
    setAvatarUploading(false);
    e.target.value = '';
  };

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
          <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current?.click()} title="Change photo">
            {profile.avatarUrl ? (
              <img className="profile-avatar profile-avatar--img" src={profile.avatarUrl} alt={profile.displayName} />
            ) : (
              <div className="profile-avatar">
                {profile.displayName[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="profile-avatar-overlay">
              {avatarUploading
                ? <span className="material-symbols-outlined" style={{ fontSize: 20 }}>hourglass_top</span>
                : <span className="material-symbols-outlined" style={{ fontSize: 20 }}>photo_camera</span>
              }
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
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
