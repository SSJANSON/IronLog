import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/templates', label: 'Library', icon: 'menu_book' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar_month' },
  { to: '/progress', label: 'Progress', icon: 'monitoring' },
  { to: '/you', label: 'You', icon: 'person' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
        >
          <span className="material-symbols-outlined bottom-nav__icon" aria-hidden="true">{icon}</span>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
