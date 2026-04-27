import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Auth() {
  const { signIn, signUp } = useAuthStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === 'signup') {
      if (!username.trim()) { setError('Username is required'); setLoading(false); return; }
      const err = await signUp(email, password, username.trim());
      if (err) setError(err);
      else setMessage('Check your email to confirm your account.');
    } else {
      const err = await signIn(email, password);
      if (err) setError(err);
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">IronLog</h1>
          <p className="auth-subtitle">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ironlifter"
              autoComplete="username"
            />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <button
          className="auth-switch"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null); }}
        >
          {mode === 'signin'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
