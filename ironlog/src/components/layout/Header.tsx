import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  brand?: boolean;
  right?: ReactNode;
}

export function Header({ title, showBack = false, brand = false, right }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="app-header__left">
        {showBack && (
          <button className="app-header__back" onClick={() => navigate(-1)} aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
      </div>
      <h1 className={`app-header__title${brand ? ' app-header__title--brand' : ''}`}>{title}</h1>
      <div className="app-header__right">{right}</div>
    </header>
  );
}
