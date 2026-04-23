import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  right?: ReactNode;
}

export function Header({ title, showBack = false, right }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="app-header__left">
        {showBack && (
          <button
            className="app-header__back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ←
          </button>
        )}
      </div>
      <h1 className="app-header__title">{title}</h1>
      <div className="app-header__right">{right}</div>
    </header>
  );
}
