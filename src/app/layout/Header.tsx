import { Link, NavLink, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Today', end: true },
  { to: '/gallery', label: 'Gallery', end: false },
  { to: '/explore', label: 'Explore', end: false },
];

export function Header() {
  const { pathname } = useLocation();
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand" aria-label="NASA Explorer home">
          <img src="/favicon.svg" alt="" />
          <span>NASA Explorer</span>
        </Link>
        <nav className="nav" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive || (link.to === '/' && pathname.startsWith('/today'))
                  ? 'active'
                  : undefined
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
